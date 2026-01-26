import type { FastifyInstance } from "fastify";
import { createRateLimiter } from "../middleware/rate-limit";
import type { ExportService } from "../services/export-service";
import type { ExportFormat } from "../types/domain";

type EnqueueBody = {
  fileId: string;
  format: ExportFormat;
};

export const registerExportRoutes = (app: FastifyInstance, exportsService: ExportService): void => {
  const rateLimit = createRateLimiter({
    windowMs: 60_000,
    max: 60,
    key: (request) => request.user?.sub ?? request.ip,
  });

  app.post<{ Body: EnqueueBody }>(
    "/exports",
    { preHandler: [app.authenticate, rateLimit] },
    async (request, reply) => {
      const { fileId, format } = request.body;
      if (!fileId || !format) {
        reply
          .status(400)
          .send({ code: "VALIDATION_FAILED", message: "fileId and format required", requestId: request.id });
        return;
      }

      if (format !== "svg" && format !== "png") {
        reply
          .status(400)
          .send({ code: "VALIDATION_FAILED", message: "Invalid export format", requestId: request.id });
        return;
      }

      const job = await exportsService.enqueue(fileId, format);
      reply.send(job);
    }
  );

  app.get<{ Params: { jobId: string } }>(
    "/exports/:jobId",
    { preHandler: [app.authenticate, rateLimit] },
    async (request, reply) => {
      const job = await exportsService.getJob(request.params.jobId);
      if (!job) {
        reply
          .status(404)
          .send({ code: "NOT_FOUND", message: "Export job not found", requestId: request.id });
        return;
      }

      reply.send(job);
    }
  );
};
