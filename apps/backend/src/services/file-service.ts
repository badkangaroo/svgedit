import { randomUUID } from "crypto";
import type { FileRevision, ProjectFile } from "../types/domain";
import { blobKeys, blobStore } from "../storage/blob-store";
import { getDb } from "../db/client";

export type CreateFileInput = {
  projectId: string;
  name: string;
  svgText: string;
};

export type UpdateFileInput = {
  svgText: string;
};

export type FileService = {
  createFile: (input: CreateFileInput) => Promise<ProjectFile>;
  updateFile: (projectId: string, fileId: string, input: UpdateFileInput) => Promise<ProjectFile>;
  getFile: (projectId: string, fileId: string) => Promise<ProjectFile | null>;
  getFileContent: (projectId: string, fileId: string) => Promise<string | null>;
  createRevision: (projectId: string, fileId: string, svgText: string) => Promise<FileRevision>;
};

export const createFileService = (): FileService => {
  const sql = getDb();

  type FileRow = {
    id: string;
    project_id: string;
    name: string;
    blob_key: string;
    created_at: string;
    updated_at: string;
  };

  type RevisionRow = {
    id: string;
    file_id: string;
    blob_key: string;
    created_at: string;
  };

  const mapFile = (row: FileRow): ProjectFile => ({
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    blobKey: row.blob_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const mapRevision = (row: RevisionRow): FileRevision => ({
    id: row.id,
    fileId: row.file_id,
    blobKey: row.blob_key,
    createdAt: row.created_at,
  });

  const createFile = async (input: CreateFileInput): Promise<ProjectFile> => {
    const fileId = randomUUID();
    const blobKey = blobKeys.currentFile(input.projectId, fileId);

    await blobStore.putText(blobKey, input.svgText);

    const rows = await sql<FileRow[]>`
      insert into files (id, project_id, name, blob_key)
      values (${fileId}, ${input.projectId}, ${input.name}, ${blobKey})
      returning id, project_id, name, blob_key, created_at, updated_at
    `;

    await createRevision(input.projectId, fileId, input.svgText);
    return mapFile(rows[0]);
  };

  const updateFile = async (
    projectId: string,
    fileId: string,
    input: UpdateFileInput
  ): Promise<ProjectFile> => {
    const rows = await sql<FileRow[]>`
      update files
      set updated_at = now()
      where id = ${fileId} and project_id = ${projectId}
      returning id, project_id, name, blob_key, created_at, updated_at
    `;
    if (rows.length === 0) {
      const error = new Error("File not found");
      (error as Error & { statusCode?: number }).statusCode = 404;
      throw error;
    }

    const file = mapFile(rows[0]);
    await blobStore.putText(file.blobKey, input.svgText);
    await createRevision(projectId, fileId, input.svgText);

    return file;
  };

  const getFile = async (projectId: string, fileId: string): Promise<ProjectFile | null> => {
    const rows = await sql<FileRow[]>`
      select id, project_id, name, blob_key, created_at, updated_at
      from files
      where id = ${fileId} and project_id = ${projectId}
      limit 1
    `;
    return rows.length > 0 ? mapFile(rows[0]) : null;
  };

  const getFileContent = async (projectId: string, fileId: string): Promise<string | null> => {
    const file = await getFile(projectId, fileId);
    if (!file) {
      return null;
    }
    return blobStore.getText(file.blobKey);
  };

  const createRevision = async (
    projectId: string,
    fileId: string,
    svgText: string
  ): Promise<FileRevision> => {
    const revisionId = randomUUID();
    const blobKey = blobKeys.revision(projectId, fileId, revisionId);
    await blobStore.putText(blobKey, svgText);

    const rows = await sql<RevisionRow[]>`
      insert into file_revisions (id, file_id, blob_key)
      values (${revisionId}, ${fileId}, ${blobKey})
      returning id, file_id, blob_key, created_at
    `;

    return mapRevision(rows[0]);
  };

  return {
    createFile,
    updateFile,
    getFile,
    getFileContent,
    createRevision,
  };
};
