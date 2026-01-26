import type { FastifyInstance } from "fastify";
import type { AuthService } from "../services/auth-service";
import { createRateLimiter } from "../middleware/rate-limit";

type AuthBody = {
  email: string;
  password: string;
};

type RefreshBody = {
  refreshToken: string;
};

export const registerAuthRoutes = (app: FastifyInstance, auth: AuthService): void => {
  const rateLimit = createRateLimiter({
    windowMs: 60_000,
    max: 30,
    key: (request) => request.ip,
  });

  app.post<{ Body: AuthBody }>("/auth/signup", { preHandler: [rateLimit] }, async (request, reply) => {
    const { email, password } = request.body;
    if (!email || !password) {
      reply
        .status(400)
        .send({ code: "VALIDATION_FAILED", message: "Email and password required", requestId: request.id });
      return;
    }

    const tokens = await auth.signup(email, password);
    reply.send(tokens);
  });

  app.post<{ Body: AuthBody }>("/auth/login", { preHandler: [rateLimit] }, async (request, reply) => {
    const { email, password } = request.body;
    if (!email || !password) {
      reply
        .status(400)
        .send({ code: "VALIDATION_FAILED", message: "Email and password required", requestId: request.id });
      return;
    }

    const tokens = await auth.login(email, password);
    reply.send(tokens);
  });

  app.post<{ Body: RefreshBody }>(
    "/auth/refresh",
    { preHandler: [rateLimit] },
    async (request, reply) => {
    const { refreshToken } = request.body;
    if (!refreshToken) {
      reply
        .status(400)
        .send({ code: "VALIDATION_FAILED", message: "Refresh token required", requestId: request.id });
      return;
    }

      const tokens = await auth.refresh(refreshToken);
      reply.send(tokens);
    }
  );
};
