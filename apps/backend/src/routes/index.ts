import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config";
import type { Services } from "../services";
import { registerHealthRoutes } from "./health";
import { registerAuthRoutes } from "./auth";
import { registerProjectRoutes } from "./projects";
import { registerExportRoutes } from "./exports";
import { registerFileRoutes } from "./files";

export const registerRoutes = (app: FastifyInstance, config: AppConfig, services: Services): void => {
  registerHealthRoutes(app, config);
  registerAuthRoutes(app, services.auth);
  registerProjectRoutes(app, services.projects, services.audit);
  registerFileRoutes(app, services.projects, services.files, services.audit);
  registerExportRoutes(app, services.exports);
};
