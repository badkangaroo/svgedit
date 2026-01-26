export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type AuthJwtPayload = {
  sub: string;
  email: string;
};
