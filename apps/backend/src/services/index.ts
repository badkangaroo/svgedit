import type { AuthService } from "./auth-service";
import { createAuthService } from "./auth-service";
import type { AuditService } from "./audit-service";
import { createAuditService } from "./audit-service";
import type { ExportService } from "./export-service";
import { createExportService } from "./export-service";
import type { FileService } from "./file-service";
import { createFileService } from "./file-service";
import type { ProjectService } from "./project-service";
import { createProjectService } from "./project-service";
import type { AuthJwtPayload } from "../types/auth";

export type Services = {
  auth: AuthService;
  audit: AuditService;
  projects: ProjectService;
  files: FileService;
  exports: ExportService;
};

export type ServicesConfig = {
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  signAccessToken: (payload: AuthJwtPayload, expiresInSeconds: number) => string;
};

export const createServices = (config: ServicesConfig): Services => ({
  auth: createAuthService({
    accessTokenTtlSeconds: config.accessTokenTtlSeconds,
    refreshTokenTtlSeconds: config.refreshTokenTtlSeconds,
    signAccessToken: config.signAccessToken,
  }),
  audit: createAuditService(),
  projects: createProjectService(),
  files: createFileService(),
  exports: createExportService(),
});
