import type { ExportFormat, ExportJob } from "../types/domain";
import { getDb } from "../db/client";

export type ExportService = {
  enqueue: (fileId: string, format: ExportFormat) => Promise<ExportJob>;
  getJob: (jobId: string) => Promise<ExportJob | null>;
};

export const createExportService = (): ExportService => {
  const sql = getDb();

  type ExportRow = {
    id: string;
    file_id: string;
    format: ExportFormat;
    status: ExportJob["status"];
    result_blob_key: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
  };

  const mapJob = (row: ExportRow): ExportJob => ({
    id: row.id,
    fileId: row.file_id,
    format: row.format,
    status: row.status,
    resultBlobKey: row.result_blob_key ?? undefined,
    errorMessage: row.error_message ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const enqueue = async (fileId: string, format: ExportFormat): Promise<ExportJob> => {
    const rows = await sql<ExportRow[]>`
      insert into export_jobs (file_id, format, status)
      values (${fileId}, ${format}, 'queued')
      returning id, file_id, format, status, result_blob_key, error_message, created_at, updated_at
    `;

    return mapJob(rows[0]);
  };

  const getJob = async (jobId: string): Promise<ExportJob | null> => {
    const rows = await sql<ExportRow[]>`
      select id, file_id, format, status, result_blob_key, error_message, created_at, updated_at
      from export_jobs
      where id = ${jobId}
      limit 1
    `;

    return rows.length > 0 ? mapJob(rows[0]) : null;
  };

  return {
    enqueue,
    getJob,
  };
};
