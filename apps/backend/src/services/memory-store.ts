import type {
  AuditLog,
  ExportJob,
  FileRevision,
  Project,
  ProjectFile,
  ProjectMember,
  ProjectRole,
  User,
} from "../types/domain";

type RefreshTokenRecord = {
  token: string;
  userId: string;
  expiresAt: number;
};

export type MemoryStore = {
  users: Map<string, User>;
  usersByEmail: Map<string, string>;
  refreshTokens: Map<string, RefreshTokenRecord>;
  projects: Map<string, Project>;
  projectMembers: Map<string, Map<string, ProjectRole>>;
  files: Map<string, ProjectFile>;
  fileRevisions: Map<string, FileRevision>;
  exportJobs: Map<string, ExportJob>;
  auditLogs: Map<string, AuditLog>;
};

export const createMemoryStore = (): MemoryStore => ({
  users: new Map(),
  usersByEmail: new Map(),
  refreshTokens: new Map(),
  projects: new Map(),
  projectMembers: new Map(),
  files: new Map(),
  fileRevisions: new Map(),
  exportJobs: new Map(),
  auditLogs: new Map(),
});

export const memoryStore = createMemoryStore();
