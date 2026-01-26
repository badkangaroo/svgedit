import type { Project, ProjectMember, ProjectRole } from "../types/domain";
import { getDb } from "../db/client";

export type CreateProjectInput = {
  name: string;
};

export type ProjectService = {
  listProjects: (userId: string) => Promise<Project[]>;
  createProject: (userId: string, input: CreateProjectInput) => Promise<Project>;
  getMemberRole: (projectId: string, userId: string) => Promise<ProjectRole | null>;
  addMember: (projectId: string, userId: string, role: ProjectRole) => Promise<ProjectMember>;
};

export const createProjectService = (): ProjectService => {
  const sql = getDb();

  type ProjectRow = {
    id: string;
    owner_id: string;
    name: string;
    created_at: string;
    updated_at: string;
  };

  type ProjectMemberRow = {
    project_id: string;
    user_id: string;
    role: ProjectRole;
    created_at: string;
  };

  const mapProject = (row: ProjectRow): Project => ({
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const mapMember = (row: ProjectMemberRow): ProjectMember => ({
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
  });

  const listProjects = async (userId: string): Promise<Project[]> => {
    const rows = await sql<ProjectRow[]>`
      select distinct p.id, p.owner_id, p.name, p.created_at, p.updated_at
      from projects p
      left join project_members pm on pm.project_id = p.id
      where p.owner_id = ${userId} or pm.user_id = ${userId}
      order by p.updated_at desc
    `;

    return rows.map(mapProject);
  };

  const createProject = async (userId: string, input: CreateProjectInput): Promise<Project> => {
    const rows = await sql<ProjectRow[]>`
      insert into projects (owner_id, name)
      values (${userId}, ${input.name})
      returning id, owner_id, name, created_at, updated_at
    `;
    const project = mapProject(rows[0]);

    await sql`
      insert into project_members (project_id, user_id, role)
      values (${project.id}, ${userId}, 'owner')
      on conflict (project_id, user_id) do nothing
    `;

    return project;
  };

  const getMemberRole = async (projectId: string, userId: string): Promise<ProjectRole | null> => {
    const ownerRows = await sql<{ owner_id: string }[]>`
      select owner_id
      from projects
      where id = ${projectId}
      limit 1
    `;
    if (ownerRows.length === 0) {
      return null;
    }
    if (ownerRows[0].owner_id === userId) {
      return "owner";
    }

    const roleRows = await sql<{ role: ProjectRole }[]>`
      select role
      from project_members
      where project_id = ${projectId} and user_id = ${userId}
      limit 1
    `;
    return roleRows.length > 0 ? roleRows[0].role : null;
  };

  const addMember = async (
    projectId: string,
    userId: string,
    role: ProjectRole
  ): Promise<ProjectMember> => {
    const projectRows = await sql<{ id: string }[]>`
      select id
      from projects
      where id = ${projectId}
      limit 1
    `;
    if (projectRows.length === 0) {
      const error = new Error("Project not found");
      (error as Error & { statusCode?: number }).statusCode = 404;
      throw error;
    }

    const rows = await sql<ProjectMemberRow[]>`
      insert into project_members (project_id, user_id, role)
      values (${projectId}, ${userId}, ${role})
      on conflict (project_id, user_id)
      do update set role = excluded.role
      returning project_id, user_id, role, created_at
    `;

    return mapMember(rows[0]);
  };

  return {
    listProjects,
    createProject,
    getMemberRole,
    addMember,
  };
};
