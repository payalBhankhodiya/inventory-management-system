import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { auditLogs } from "../../db/schema/audit-log.js";

import type {
  AuditLogListQuery,
} from "./audit-log.schema.js";

export async function getAuditLogs(
  organizationId: string,
  query: AuditLogListQuery,
) {
  const conditions = [eq(auditLogs.organizationId, organizationId)];

  if (query.search) {
    conditions.push(
      or(
        ilike(auditLogs.action, `%${query.search}%`),
        ilike(auditLogs.entityType, `%${query.search}%`),
        ilike(auditLogs.userAgent, `%${query.search}%`),
      )!,
    );
  }

  if (query.action) {
    conditions.push(ilike(auditLogs.action, `%${query.action}%`));
  }

  if (query.entityType) {
    conditions.push(eq(auditLogs.entityType, query.entityType));
  }

  if (query.entityId) {
    conditions.push(eq(auditLogs.entityId, query.entityId));
  }

  if (query.userId) {
    conditions.push(eq(auditLogs.userId, query.userId));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(auditLogs)
    .where(and(...conditions));

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getAuditLogById(
  organizationId: string,
  auditLogId: string,
) {
  const auditLog = await db.query.auditLogs.findFirst({
    where: and(
      eq(auditLogs.id, auditLogId),
      eq(auditLogs.organizationId, organizationId),
    ),
  });

  if (!auditLog) {
    throw new Error("Audit log not found");
  }

  return auditLog;
}

type CreateAuditLogData = {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function createAuditLog(
  input: CreateAuditLogData,
) {
  const [auditLog] = await db
    .insert(auditLogs)
    .values({
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    })
    .returning();

  if (!auditLog) {
    throw new Error("Failed to create audit log");
  }

  return auditLog;
}
