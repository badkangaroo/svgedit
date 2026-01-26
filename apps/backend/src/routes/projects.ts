import type { FastifyInstance } from "fastify";
import type { AuditService } from "../services/audit-service";
import { createRateLimiter } from "../middleware/rate-limit";
import type { ProjectService } from "../services/project-service";

type CreateProjectBody = {
  name: string;
};

export const registerProjectRoutes = (
  app: FastifyInstance,
  projects: ProjectService,
  audit: AuditService
): void => {
  const rateLimit = createRateLimiter({
    windowMs: 60_000,
    max: 60,
    key: (request) => request.user?.sub ?? request.ip,
  });

  app.get("/projects", { preHandler: [app.authenticate, rateLimit] }, async (request) => {
    const userId = request.user.sub;
    return projects.listProjects(userId);
  });

  app.post<{ Body: CreateProjectBody }>(
    "/projects",
    { preHandler: [app.authenticate, rateLimit] },
    async (request, reply) => {
      const { name } = request.body;
      if (!name) {
        reply
          .status(400)
          .send({ code: "VALIDATION_FAILED", message: "Project name required", requestId: request.id });
        return;
      }

      const project = await projects.createProject(request.user.sub, { name });
      await audit.record({
        actorUserId: request.user.sub,
        action: "project.create",
        targetType: "project",
        targetId: project.id,
        metadata: { name: project.name },
      });
      reply.send(project);
    }
  );
};
