import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { storageAreas } from "../../db/schema/storage-area.js";
import type {
  CreateStorageAreaInput,
  StorageAreasListQuery,
  UpdateStorageAreaInput,
} from "./storage-area.schema.js";
import { AuditInfo } from "../../types/audit.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";

export async function getStorageAreas(
  organizationId: string,
  query: StorageAreasListQuery,
) {
  const conditions = [eq(storageAreas.organizationId, organizationId)];

  if (query.search) {
    conditions.push(
      or(
        ilike(storageAreas.name, `%${query.search}%`),
        ilike(storageAreas.code, `%${query.search}%`),
        ilike(storageAreas.description, `%${query.search}%`),
      )!,
    );
  }

  if (query.status) {
    conditions.push(eq(storageAreas.status, query.status));
  }

  if (query.siteId) {
    conditions.push(eq(storageAreas.siteId, query.siteId));
  }

  if (query.departmentId) {
    conditions.push(eq(storageAreas.departmentId, query.departmentId));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(storageAreas)
    .where(and(...conditions))
    .orderBy(desc(storageAreas.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(storageAreas)
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

export async function getStorageAreaById(
  organizationId: string,
  storageAreaId: string,
) {
  const storageArea = await db.query.storageAreas.findFirst({
    where: and(
      eq(storageAreas.id, storageAreaId),
      eq(storageAreas.organizationId, organizationId),
    ),
  });

  if (!storageArea) {
    throw new Error("Storage area not found");
  }

  return storageArea;
}

export async function createStorageArea(
  input: CreateStorageAreaInput,
  auditInfo: AuditInfo,
) {
  const existingStorageArea = await db.query.storageAreas.findFirst({
    where: and(
      eq(storageAreas.organizationId, input.organizationId),
      eq(storageAreas.code, input.code),
    ),
  });

  if (existingStorageArea) {
    throw new Error("Storage area with this code already exists");
  }

  const [storageArea] = await db
    .insert(storageAreas)
    .values({
      organizationId: input.organizationId,
      siteId: input.siteId,
      departmentId: input.departmentId,
      name: input.name,
      code: input.code,
      description: input.description,
      status: input.status,
    })
    .returning();

  if (!storageArea) {
    throw new Error("Failed to create storage area");
  }

  await createAuditLog({
    organizationId: storageArea.organizationId,
    userId: auditInfo.userId,
    action: "CREATE",
    entityType: "STORAGE_AREA",
    entityId: storageArea.id,
    oldValue: null,
    newValue: storageArea,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return storageArea;
}

export async function updateStorageArea(
  organizationId: string,
  storageAreaId: string,
  input: UpdateStorageAreaInput,
  auditInfo: AuditInfo,
) {
  const existingStorageArea = await db.query.storageAreas.findFirst({
    where: and(
      eq(storageAreas.id, storageAreaId),
      eq(storageAreas.organizationId, organizationId),
    ),
  });

  if (!existingStorageArea) {
    throw new Error("Storage area not found");
  }

  if (input.code && input.code !== existingStorageArea.code) {
    const duplicateStorageArea = await db.query.storageAreas.findFirst({
      where: and(
        eq(storageAreas.organizationId, organizationId),
        eq(storageAreas.code, input.code),
      ),
    });

    if (duplicateStorageArea) {
      throw new Error("Storage area with this code already exists");
    }
  }

  const [storageArea] = await db
    .update(storageAreas)
    .set({
      name: input.name,
      code: input.code,
      description: input.description,
      siteId: input.siteId,
      departmentId: input.departmentId,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(storageAreas.id, storageAreaId),
        eq(storageAreas.organizationId, organizationId),
      ),
    )
    .returning();

  if (!storageArea) {
    throw new Error("Failed to update storage area");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "STORAGE_AREA",
    entityId: storageArea.id,
    oldValue: existingStorageArea,
    newValue: storageArea,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return storageArea;
}

export async function deleteStorageArea(
  organizationId: string,
  storageAreaId: string,
  auditInfo: AuditInfo,
) {
  const existingStorageArea = await db.query.storageAreas.findFirst({
    where: and(
      eq(storageAreas.id, storageAreaId),
      eq(storageAreas.organizationId, organizationId),
    ),
  });

  if (!existingStorageArea) {
    throw new Error("Storage area not found");
  }

  if (existingStorageArea.status === "INACTIVE") {
    throw new Error("Storage area is already inactive");
  }

  const [storageArea] = await db
    .update(storageAreas)
    .set({
      status: "INACTIVE",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(storageAreas.id, storageAreaId),
        eq(storageAreas.organizationId, organizationId),
      ),
    )
    .returning();

  if (!storageArea) {
    throw new Error("Failed to deactivate storage area");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "DELETE",
    entityType: "STORAGE_AREA",
    entityId: storageArea.id,
    oldValue: existingStorageArea,
    newValue: storageArea,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return storageArea;
}
