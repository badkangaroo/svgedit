import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AuditService } from "../services/audit-service";
import { createRateLimiter } from "../middleware/rate-limit";
import type { FileService } from "../services/file-service";
import type { ProjectService } from "../services/project-service";
import type { ProjectRole } from "../types/domain";

type CreateFileBody = {
  name: string;
  svgText: string;
};

type UpdateFileBody = {
  svgText: string;
};

const roleRank: Record<ProjectRole, number> = {
  owner: 3,
  editor: 2,
  viewer: 1,
};

const ensureProjectRole = async (
  request: FastifyRequest,
  reply: FastifyReply,
  projects: ProjectService,
  projectId: string,
  requiredRole: ProjectRole
): Promise<ProjectRole | null> => {
  const role = await projects.getMemberRole(projectId, request.user.sub);
  if (!role || roleRank[role] < roleRank[requiredRole]) {
    reply
      .status(403)
      .send({ code: "FORBIDDEN", message: "Insufficient permissions", requestId: request.id });
    return null;
  }
  return role;
};

export const registerFileRoutes = (
  app: FastifyInstance,
  projects: ProjectService,
  files: FileService,
  audit: AuditService
): void => {
  const rateLimit = createRateLimiter({
    windowMs: 60_000,
    max: 120,
    key: (request) => request.user?.sub ?? request.ip,
  });

  app.post<{ Params: { projectId: string }; Body: CreateFileBody }>(
    "/projects/:projectId/files",
    { preHandler: [app.authenticate, rateLimit] },
    async (request, reply) => {
      const { projectId } = request.params;
      if (!(await ensureProjectRole(request, reply, projects, projectId, "editor"))) {
        return;
      }

      const { name, svgText } = request.body;
      if (!name || !svgText) {
        reply
          .status(400)
          .send({ code: "VALIDATION_FAILED", message: "name and svgText required", requestId: request.id });
        return;
      }

      const file = await files.createFile({ projectId, name, svgText });
      await audit.record({
        actorUserId: request.user.sub,
        action: "file.create",
        targetType: "file",
        targetId: file.id,
        metadata: { projectId, name },
      });
      reply.send(file);
    }
  );

  app.get<{ Params: { projectId: string; fileId: string } }>(
    "/projects/:projectId/files/:fileId",
    { preHandler: [app.authenticate, rateLimit] },
    async (request, reply) => {
      const { projectId, fileId } = request.params;
      if (!(await ensureProjectRole(request, reply, projects, projectId, "viewer"))) {
        return;
      }

      const file = await files.getFile(projectId, fileId);
      if (!file) {
        reply.status(404).send({ code: "NOT_FOUND", message: "File not found", requestId: request.id });
        return;
      }

      const svgText = await files.getFileContent(projectId, fileId);
      reply.send({ ...file, svgText });
    }
  );

  app.put<{ Params: { projectId: string; fileId: string }; Body: UpdateFileBody }>(
    "/projects/:projectId/files/:fileId",
    { preHandler: [app.authenticate, rateLimit] },
    async (request, reply) => {
      const { projectId, fileId } = request.params;
      if (!(await ensureProjectRole(request, reply, projects, projectId, "editor"))) {
        return;
      }

      const { svgText } = request.body;
      if (!svgText) {
        reply.status(400).send({ code: "VALIDATION_FAILED", message: "svgText required", requestId: request.id });
        return;
      }

      const file = await files.updateFile(projectId, fileId, { svgText });
      await audit.record({
        actorUserId: request.user.sub,
        action: "file.update",
        targetType: "file",
        targetId: file.id,
        metadata: { projectId },
      });
      reply.send(file);
    }
  );
};
