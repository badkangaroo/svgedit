import { randomUUID } from "crypto";
import argon2 from "argon2";
import type { AuthJwtPayload, AuthTokens } from "../types/auth";
import type { User } from "../types/domain";
import { getDb } from "../db/client";

export type AuthServiceConfig = {
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  signAccessToken: (payload: AuthJwtPayload, expiresInSeconds: number) => string;
};

export type AuthService = {
  signup: (email: string, password: string) => Promise<AuthTokens>;
  login: (email: string, password: string) => Promise<AuthTokens>;
  refresh: (refreshToken: string) => Promise<AuthTokens>;
  getUserById: (userId: string) => Promise<User | null>;
};

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
};

type RefreshTokenRow = {
  token: string;
  user_id: string;
  expires_at: string;
};

const mapUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createAuthService = (config: AuthServiceConfig): AuthService => {
  const sql = getDb();

  const signup = async (email: string, password: string): Promise<AuthTokens> => {
    const existing = await sql<UserRow[]>`
      select id, email, password_hash, created_at, updated_at
      from users
      where email = ${email}
      limit 1
    `;
    if (existing.length > 0) {
      const error = new Error("Email already registered");
      (error as Error & { statusCode?: number }).statusCode = 409;
      throw error;
    }

    const passwordHash = await argon2.hash(password);
    const inserted = await sql<UserRow[]>`
      insert into users (email, password_hash)
      values (${email}, ${passwordHash})
      returning id, email, password_hash, created_at, updated_at
    `;

    const user = mapUser(inserted[0]);
    return issueTokens(config, user, sql);
  };

  const login = async (email: string, password: string): Promise<AuthTokens> => {
    const rows = await sql<UserRow[]>`
      select id, email, password_hash, created_at, updated_at
      from users
      where email = ${email}
      limit 1
    `;
    if (rows.length === 0) {
      const error = new Error("Invalid credentials");
      (error as Error & { statusCode?: number }).statusCode = 401;
      throw error;
    }

    const user = mapUser(rows[0]);
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      const error = new Error("Invalid credentials");
      (error as Error & { statusCode?: number }).statusCode = 401;
      throw error;
    }

    return issueTokens(config, user, sql);
  };

  const refresh = async (refreshToken: string): Promise<AuthTokens> => {
    const rows = await sql<RefreshTokenRow[]>`
      select token, user_id, expires_at
      from refresh_tokens
      where token = ${refreshToken}
      limit 1
    `;

    if (rows.length === 0) {
      const error = new Error("Invalid refresh token");
      (error as Error & { statusCode?: number }).statusCode = 401;
      throw error;
    }

    const record = rows[0];
    const expiresAt = new Date(record.expires_at).getTime();
    if (expiresAt <= Date.now()) {
      await sql`delete from refresh_tokens where token = ${refreshToken}`;
      const error = new Error("Invalid refresh token");
      (error as Error & { statusCode?: number }).statusCode = 401;
      throw error;
    }

    const userRows = await sql<UserRow[]>`
      select id, email, password_hash, created_at, updated_at
      from users
      where id = ${record.user_id}
      limit 1
    `;
    if (userRows.length === 0) {
      await sql`delete from refresh_tokens where token = ${refreshToken}`;
      const error = new Error("Invalid refresh token");
      (error as Error & { statusCode?: number }).statusCode = 401;
      throw error;
    }

    await sql`delete from refresh_tokens where token = ${refreshToken}`;
    const user = mapUser(userRows[0]);
    return issueTokens(config, user, sql);
  };

  const getUserById = async (userId: string): Promise<User | null> => {
    const rows = await sql<UserRow[]>`
      select id, email, password_hash, created_at, updated_at
      from users
      where id = ${userId}
      limit 1
    `;

    return rows.length > 0 ? mapUser(rows[0]) : null;
  };

  return {
    signup,
    login,
    refresh,
    getUserById,
  };
};

const issueTokens = async (
  config: AuthServiceConfig,
  user: User,
  sql: ReturnType<typeof getDb>
): Promise<AuthTokens> => {
  const accessToken = config.signAccessToken(
    { sub: user.id, email: user.email },
    config.accessTokenTtlSeconds
  );

  const refreshToken = randomUUID();
  const expiresAt = new Date(Date.now() + config.refreshTokenTtlSeconds * 1000).toISOString();

  await sql`
    insert into refresh_tokens (token, user_id, expires_at)
    values (${refreshToken}, ${user.id}, ${expiresAt})
  `;

  return {
    accessToken,
    refreshToken,
    expiresIn: config.accessTokenTtlSeconds,
  };
};
