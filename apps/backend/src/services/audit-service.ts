import type { AuditLog } from "../types/domain";
import { getDb } from "../db/client";

export type AuditService = {
  record: (entry: Omit<AuditLog, "id" | "createdAt">) => Promise<AuditLog>;
};

export const createAuditService = (): AuditService => {
  const sql = getDb();

  type AuditRow = {
    id: string;
    actor_user_id: string | null;
    action: string;
    target_type: string;
    target_id: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
  };

  const mapAudit = (row: AuditRow): AuditLog => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
  });

  const record = async (entry: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> => {
    const rows = await sql<AuditRow[]>`
      insert into audit_logs (actor_user_id, action, target_type, target_id, metadata)
      values (
        ${entry.actorUserId},
        ${entry.action},
        ${entry.targetType},
        ${entry.targetId ?? null},
        ${entry.metadata ?? null}
      )
      returning id, actor_user_id, action, target_type, target_id, metadata, created_at
    `;

    return mapAudit(rows[0]);
  };

  return { record };
};
