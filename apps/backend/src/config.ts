import pkg from "../package.json";

export type AppConfig = {
  env: string;
  version: string;
  port: number;
  databaseUrl: string;
  auth: {
    jwtSecret: string;
    accessTokenTtlSeconds: number;
    refreshTokenTtlSeconds: number;
  };
};

export const getConfig = (): AppConfig => {
  const env = process.env.NODE_ENV ?? "development";
  const version = process.env.APP_VERSION ?? pkg.version ?? "dev";
  const port = Number(process.env.PORT ?? 3001);
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-me";
  const accessTokenTtlSeconds = Number(process.env.JWT_ACCESS_TTL ?? 900);
  const refreshTokenTtlSeconds = Number(process.env.JWT_REFRESH_TTL ?? 60 * 60 * 24 * 30);

  return {
    env,
    version,
    port,
    databaseUrl,
    auth: {
      jwtSecret,
      accessTokenTtlSeconds,
      refreshTokenTtlSeconds,
    },
  };
};
