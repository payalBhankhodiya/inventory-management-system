import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { unitsOfMeasure } from "../../db/schema/unit-of-measure.js";

import type {
  CreateUnitOfMeasureInput,
  UnitsOfMeasureListQuery,
  UpdateUnitOfMeasureInput,
} from "./unit-of-measure.schema.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";
import { AuditInfo } from "../../types/audit.js";

export async function getUnitsOfMeasure(
  organizationId: string,
  query: UnitsOfMeasureListQuery,
) {
  const conditions = [eq(unitsOfMeasure.organizationId, organizationId)];

  if (query.search) {
    conditions.push(
      or(
        ilike(unitsOfMeasure.name, `%${query.search}%`),
        ilike(unitsOfMeasure.code, `%${query.search}%`),
        ilike(unitsOfMeasure.description, `%${query.search}%`),
      )!,
    );
  }

  if (query.status) {
    conditions.push(eq(unitsOfMeasure.status, query.status));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(unitsOfMeasure)
    .where(and(...conditions))
    .orderBy(desc(unitsOfMeasure.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(unitsOfMeasure)
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

export async function getUnitOfMeasureById(
  organizationId: string,
  unitOfMeasureId: string,
) {
  const unitOfMeasure = await db.query.unitsOfMeasure.findFirst({
    where: and(
      eq(unitsOfMeasure.id, unitOfMeasureId),
      eq(unitsOfMeasure.organizationId, organizationId),
    ),
  });

  if (!unitOfMeasure) {
    throw new Error("Unit of measure not found");
  }

  return unitOfMeasure;
}

export async function createUnitOfMeasure(
  input: CreateUnitOfMeasureInput,
  auditInfo: AuditInfo,
) {
  const existingUnit = await db.query.unitsOfMeasure.findFirst({
    where: and(
      eq(unitsOfMeasure.organizationId, input.organizationId),
      eq(unitsOfMeasure.code, input.code),
    ),
  });

  if (existingUnit) {
    throw new Error("Unit of measure with this code already exists");
  }

  const [unitOfMeasure] = await db
    .insert(unitsOfMeasure)
    .values({
      organizationId: input.organizationId,
      name: input.name,
      code: input.code,
      description: input.description,
      status: input.status,
    })
    .returning();

  if (!unitOfMeasure) {
    throw new Error("Failed to create unit of measure");
  }

  await createAuditLog({
    organizationId: unitOfMeasure.organizationId,
    userId: auditInfo.userId,
    action: "CREATE",
    entityType: "UNIT_OF_MEASURE",
    entityId: unitOfMeasure.id,
    oldValue: null,
    newValue: unitOfMeasure,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return unitOfMeasure;
}

export async function updateUnitOfMeasure(
  organizationId: string,
  unitOfMeasureId: string,
  input: UpdateUnitOfMeasureInput,
  auditInfo: AuditInfo,
) {
  const existingUnitOfMeasure = await db.query.unitsOfMeasure.findFirst({
    where: and(
      eq(unitsOfMeasure.id, unitOfMeasureId),
      eq(unitsOfMeasure.organizationId, organizationId),
    ),
  });

  if (!existingUnitOfMeasure) {
    throw new Error("Unit of measure not found");
  }

  if (input.code && input.code !== existingUnitOfMeasure.code) {
    const duplicateUnit = await db.query.unitsOfMeasure.findFirst({
      where: and(
        eq(unitsOfMeasure.organizationId, organizationId),
        eq(unitsOfMeasure.code, input.code),
      ),
    });

    if (duplicateUnit) {
      throw new Error("Unit of measure with this code already exists");
    }
  }

  const [unitOfMeasure] = await db
    .update(unitsOfMeasure)
    .set({
      name: input.name,
      code: input.code,
      description: input.description,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(unitsOfMeasure.id, unitOfMeasureId),
        eq(unitsOfMeasure.organizationId, organizationId),
      ),
    )
    .returning();

  if (!unitOfMeasure) {
    throw new Error("Failed to update unit of measure");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "UNIT_OF_MEASURE",
    entityId: unitOfMeasure.id,
    oldValue: existingUnitOfMeasure,
    newValue: unitOfMeasure,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return unitOfMeasure;
}

export async function deleteUnitOfMeasure(
  organizationId: string,
  unitOfMeasureId: string,
  auditInfo: AuditInfo,
) {
  const existingUnitOfMeasure = await db.query.unitsOfMeasure.findFirst({
    where: and(
      eq(unitsOfMeasure.id, unitOfMeasureId),
      eq(unitsOfMeasure.organizationId, organizationId),
    ),
  });

  if (!existingUnitOfMeasure) {
    throw new Error("Unit of measure not found");
  }

  if (existingUnitOfMeasure.status === "INACTIVE") {
    throw new Error("Unit of measure is already inactive");
  }

  const [unitOfMeasure] = await db
    .update(unitsOfMeasure)
    .set({
      status: "INACTIVE",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(unitsOfMeasure.id, unitOfMeasureId),
        eq(unitsOfMeasure.organizationId, organizationId),
      ),
    )
    .returning();

  if (!unitOfMeasure) {
    throw new Error("Failed to deactivate unit of measure");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "DELETE",
    entityType: "UNIT_OF_MEASURE",
    entityId: unitOfMeasureId,
    oldValue: existingUnitOfMeasure,
    newValue: null,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return unitOfMeasure;
}
