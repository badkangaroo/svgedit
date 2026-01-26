import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config";

export const registerHealthRoutes = (app: FastifyInstance, config: AppConfig): void => {
  app.get("/health", async () => ({ status: "ok" }));

  app.get("/version", async () => ({
    version: config.version,
    env: config.env,
  }));
};
