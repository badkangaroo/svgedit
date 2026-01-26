export type ProjectRole = "owner" | "editor" | "viewer";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectMember = {
  projectId: string;
  userId: string;
  role: ProjectRole;
  createdAt: string;
};

export type ProjectFile = {
  id: string;
  projectId: string;
  name: string;
  blobKey: string;
  createdAt: string;
  updatedAt: string;
};

export type FileRevision = {
  id: string;
  fileId: string;
  blobKey: string;
  createdAt: string;
};

export type ExportFormat = "svg" | "png";
export type ExportStatus = "queued" | "running" | "completed" | "failed";

export type ExportJob = {
  id: string;
  fileId: string;
  format: ExportFormat;
  status: ExportStatus;
  resultBlobKey?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
