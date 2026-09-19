import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { maintenances } from "../../db/schema/maintenance.js";

import type {
  CreateMaintenanceInput,
  MaintenanceListQuery,
  UpdateMaintenanceInput,
} from "./maintenance.schema.js";
import { AuditInfo } from "../../types/audit.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";

export async function getMaintenances(
  organizationId: string,
  query: MaintenanceListQuery,
) {
  const conditions = [eq(maintenances.organizationId, organizationId)];

  if (query.search) {
    conditions.push(
      or(
        ilike(maintenances.issue, `%${query.search}%`),
        ilike(maintenances.description, `%${query.search}%`),
        ilike(maintenances.resolution, `%${query.search}%`),
        ilike(maintenances.remarks, `%${query.search}%`),
      )!,
    );
  }

  if (query.status) {
    conditions.push(eq(maintenances.status, query.status));
  }

  if (query.priority) {
    conditions.push(eq(maintenances.priority, query.priority));
  }

  if (query.assetId) {
    conditions.push(eq(maintenances.assetId, query.assetId));
  }

  if (query.reportedBy) {
    conditions.push(eq(maintenances.reportedBy, query.reportedBy));
  }

  if (query.vendorId) {
    conditions.push(eq(maintenances.vendorId, query.vendorId));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(maintenances)
    .where(and(...conditions))
    .orderBy(desc(maintenances.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(maintenances)
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

export async function getMaintenanceById(
  organizationId: string,
  maintenanceId: string,
) {
  const maintenance = await db.query.maintenances.findFirst({
    where: and(
      eq(maintenances.id, maintenanceId),
      eq(maintenances.organizationId, organizationId),
    ),
  });

  if (!maintenance) {
    throw new Error("Maintenance record not found");
  }

  return maintenance;
}

export async function createMaintenance(
  input: CreateMaintenanceInput,
  auditInfo: AuditInfo,
) {
  const [maintenance] = await db
    .insert(maintenances)
    .values({
      organizationId: input.organizationId,

      assetId: input.assetId,
      reportedBy: input.reportedBy,
      vendorId: input.vendorId,

      issue: input.issue,
      description: input.description,

      priority: input.priority,

      startDate: input.startDate ? new Date(input.startDate) : undefined,

      expectedCompletionDate: input.expectedCompletionDate
        ? new Date(input.expectedCompletionDate)
        : undefined,

      completedDate: input.completedDate
        ? new Date(input.completedDate)
        : undefined,

      cost: input.cost,

      resolution: input.resolution,

      status: input.status,

      remarks: input.remarks,
    })
    .returning();

  if (!maintenance) {
    throw new Error("Failed to create maintenance record");
  }

  await createAuditLog({
    organizationId: maintenance.organizationId,
    userId: auditInfo.userId,
    action: "CREATE",
    entityType: "MAINTENANCE",
    entityId: maintenance.id,
    oldValue: null,
    newValue: maintenance,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return maintenance;
}

export async function updateMaintenance(
  organizationId: string,
  maintenanceId: string,
  input: UpdateMaintenanceInput,
  auditInfo: AuditInfo,
) {
  const existingMaintenance = await db.query.maintenances.findFirst({
    where: and(
      eq(maintenances.id, maintenanceId),
      eq(maintenances.organizationId, organizationId),
    ),
  });

  if (!existingMaintenance) {
    throw new Error("Maintenance not found");
  }

  const [maintenance] = await db
    .update(maintenances)
    .set({
      vendorId: input.vendorId,

      issue: input.issue,
      description: input.description,

      priority: input.priority,

      startDate:
        input.startDate !== undefined
          ? input.startDate === null
            ? null
            : new Date(input.startDate)
          : undefined,

      expectedCompletionDate:
        input.expectedCompletionDate !== undefined
          ? input.expectedCompletionDate === null
            ? null
            : new Date(input.expectedCompletionDate)
          : undefined,

      completedDate:
        input.completedDate !== undefined
          ? input.completedDate === null
            ? null
            : new Date(input.completedDate)
          : undefined,

      cost: input.cost,

      resolution: input.resolution,

      status: input.status,

      remarks: input.remarks,

      updatedAt: new Date(),
    })
    .where(
      and(
        eq(maintenances.id, maintenanceId),
        eq(maintenances.organizationId, organizationId),
      ),
    )
    .returning();

  if (!maintenance) {
    throw new Error("Failed to update maintenance record");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "MAINTENANCE",
    entityId: maintenance.id,
    oldValue: existingMaintenance,
    newValue: maintenance,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return maintenance;
}

export async function deleteMaintenance(
  organizationId: string,
  maintenanceId: string,
  auditInfo: AuditInfo,
) {
  const existingMaintenance = await db.query.maintenances.findFirst({
    where: and(
      eq(maintenances.id, maintenanceId),
      eq(maintenances.organizationId, organizationId),
    ),
  });

  if (!existingMaintenance) {
    throw new Error("Maintenance not found");
  }

  if (existingMaintenance.status === "IN_PROGRESS") {
    throw new Error("Maintenance in progress cannot be cancelled");
  }

  if (existingMaintenance.status === "COMPLETED") {
    throw new Error("Completed maintenance cannot be cancelled");
  }

  const [updated] = await db
    .update(maintenances)
    .set({
      status: "CANCELLED",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(maintenances.id, maintenanceId),
        eq(maintenances.organizationId, organizationId),
      ),
    )
    .returning();

  if (!updated) {
    throw new Error("Failed to cancel maintenance");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "DELETE",
    entityType: "MAINTENANCE",
    entityId: maintenanceId,
    oldValue: existingMaintenance,
    newValue: null,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return updated;
}
