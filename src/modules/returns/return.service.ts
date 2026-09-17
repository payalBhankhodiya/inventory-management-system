import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { returns } from "../../db/schema/return.js";

import type {
  CreateReturnInput,
  ReturnsListQuery,
  UpdateReturnInput,
} from "./return.schema.js";

export async function getReturns(
  organizationId: string,
  query: ReturnsListQuery,
) {
  const conditions = [eq(returns.organizationId, organizationId)];

  if (query.search) {
    conditions.push(
      or(
        ilike(returns.condition, `%${query.search}%`),
        ilike(returns.damageDescription, `%${query.search}%`),
        ilike(returns.remarks, `%${query.search}%`),
      )!,
    );
  }

  if (query.status) {
    conditions.push(eq(returns.status, query.status));
  }

  if (query.condition) {
    conditions.push(ilike(returns.condition, `%${query.condition}%`));
  }

  if (query.assignmentId) {
    conditions.push(eq(returns.assignmentId, query.assignmentId));
  }

  if (query.assetId) {
    conditions.push(eq(returns.assetId, query.assetId));
  }

  if (query.returnedByUserId) {
    conditions.push(eq(returns.returnedByUserId, query.returnedByUserId));
  }

  if (query.receivedByUserId) {
    conditions.push(eq(returns.receivedByUserId, query.receivedByUserId));
  }

  if (query.returnSiteId) {
    conditions.push(eq(returns.returnSiteId, query.returnSiteId));
  }

  if (query.returnDepartmentId) {
    conditions.push(eq(returns.returnDepartmentId, query.returnDepartmentId));
  }

  if (query.returnStorageAreaId) {
    conditions.push(eq(returns.returnStorageAreaId, query.returnStorageAreaId));
  }

  if (query.returnStorageUnitId) {
    conditions.push(eq(returns.returnStorageUnitId, query.returnStorageUnitId));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(returns)
    .where(and(...conditions))
    .orderBy(desc(returns.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(returns)
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

export async function getReturnById(organizationId: string, returnId: string) {
  const returnRecord = await db.query.returns.findFirst({
    where: and(
      eq(returns.id, returnId),
      eq(returns.organizationId, organizationId),
    ),
  });

  if (!returnRecord) {
    throw new Error("Return not found");
  }

  return returnRecord;
}

export async function createReturn(input: CreateReturnInput) {
  const existingReturn = await db.query.returns.findFirst({
    where: and(
      eq(returns.organizationId, input.organizationId),
      eq(returns.assignmentId, input.assignmentId),
      eq(returns.assetId, input.assetId),
      eq(returns.status, "RECEIVED"),
    ),
  });

  if (existingReturn) {
    throw new Error("A return already exists for this assignment and asset");
  }

  const [returnRecord] = await db
    .insert(returns)
    .values({
      organizationId: input.organizationId,

      assignmentId: input.assignmentId,
      assetId: input.assetId,

      returnedByUserId: input.returnedByUserId,
      receivedByUserId: input.receivedByUserId,

      returnSiteId: input.returnSiteId,
      returnDepartmentId: input.returnDepartmentId,
      returnStorageAreaId: input.returnStorageAreaId,
      returnStorageUnitId: input.returnStorageUnitId,

      returnDate: new Date(input.returnDate),

      condition: input.condition,
      damageDescription: input.damageDescription,
      remarks: input.remarks,

      status: input.status,
    })
    .returning();

  if (!returnRecord) {
    throw new Error("Failed to create return");
  }

  return returnRecord;
}

export async function updateReturn(
  organizationId: string,
  returnId: string,
  input: UpdateReturnInput,
) {
  await getReturnById(organizationId, returnId);

  const [returnRecord] = await db
    .update(returns)
    .set({
      receivedByUserId: input.receivedByUserId,

      returnSiteId: input.returnSiteId,
      returnDepartmentId: input.returnDepartmentId,
      returnStorageAreaId: input.returnStorageAreaId,
      returnStorageUnitId: input.returnStorageUnitId,

      returnDate:
        input.returnDate !== undefined ? new Date(input.returnDate) : undefined,

      condition: input.condition,

      damageDescription: input.damageDescription,

      remarks: input.remarks,

      status: input.status,

      updatedAt: new Date(),
    })
    .where(
      and(eq(returns.id, returnId), eq(returns.organizationId, organizationId)),
    )
    .returning();

  if (!returnRecord) {
    throw new Error("Failed to update return");
  }

  return returnRecord;
}

export async function deleteReturn(organizationId: string, returnId: string) {
  const existingReturn = await getReturnById(organizationId, returnId);

  if (existingReturn.status === "COMPLETED") {
    throw new Error("Completed return cannot be cancelled");
  }

  const [returnRecord] = await db
    .update(returns)
    .set({
      status: "REJECTED",
      updatedAt: new Date(),
    })
    .where(
      and(eq(returns.id, returnId), eq(returns.organizationId, organizationId)),
    )
    .returning();

  if (!returnRecord) {
    throw new Error("Failed to reject return");
  }

  return returnRecord;
}
