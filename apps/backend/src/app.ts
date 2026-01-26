import fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { randomUUID } from "crypto";
import { getConfig, type AppConfig } from "./config";
import { registerRoutes } from "./routes";
import { createServices } from "./services";

const toErrorCode = (statusCode: number): string => {
  if (statusCode === 401) return "UNAUTHORIZED";
  if (statusCode === 403) return "FORBIDDEN";
  if (statusCode === 404) return "NOT_FOUND";
  if (statusCode === 429) return "RATE_LIMITED";
  if (statusCode >= 400 && statusCode < 500) return "VALIDATION_FAILED";
  return "INTERNAL_ERROR";
};

export const buildApp = (config: AppConfig = getConfig()): FastifyInstance => {
  const app = fastify({
    logger: true,
    genReqId: (req) => (req.headers["x-request-id"] as string) ?? randomUUID(),
  });

  app.register(cors, {
    origin: true,
    credentials: true,
  });

  app.register(jwt, {
    secret: config.auth.jwtSecret,
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: "SVG Edit Backend",
        version: config.version,
      },
    },
  });

  app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  app.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (error) {
      reply.status(401).send({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
        requestId: request.id,
      });
      return;
    }
  });

  app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      code: toErrorCode(statusCode),
      message: error.message,
      requestId: request.id,
    });
  });

  const services = createServices({
    accessTokenTtlSeconds: config.auth.accessTokenTtlSeconds,
    refreshTokenTtlSeconds: config.auth.refreshTokenTtlSeconds,
    signAccessToken: (payload, expiresInSeconds) =>
      app.jwt.sign(payload, { expiresIn: `${expiresInSeconds}s` }),
  });

  registerRoutes(app, config, services);

  return app;
};
