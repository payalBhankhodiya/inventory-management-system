import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { disposals } from "../../db/schema/disposal.js";

import type {
  CreateDisposalInput,
  DisposalListQuery,
  UpdateDisposalInput,
} from "./disposal.schema.js";

export async function getDisposals(
  organizationId: string,
  query: DisposalListQuery,
) {
  const conditions = [eq(disposals.organizationId, organizationId)];

  if (query.search) {
    conditions.push(
      or(
        ilike(disposals.reason, `%${query.search}%`),
        ilike(disposals.remarks, `%${query.search}%`),
      )!,
    );
  }

  if (query.disposalMethod) {
    conditions.push(eq(disposals.disposalMethod, query.disposalMethod));
  }

  if (query.assetId) {
    conditions.push(eq(disposals.assetId, query.assetId));
  }

  if (query.approvedBy) {
    conditions.push(eq(disposals.approvedBy, query.approvedBy));
  }

  if (query.disposedBy) {
    conditions.push(eq(disposals.disposedBy, query.disposedBy));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(disposals)
    .where(and(...conditions))
    .orderBy(desc(disposals.disposalDate))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(disposals)
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

export async function getDisposalById(
  organizationId: string,
  disposalId: string,
) {
  const disposal = await db.query.disposals.findFirst({
    where: and(
      eq(disposals.id, disposalId),
      eq(disposals.organizationId, organizationId),
    ),
  });

  if (!disposal) {
    throw new Error("Disposal record not found");
  }

  return disposal;
}

export async function createDisposal(input: CreateDisposalInput) {
  const existingDisposal = await db.query.disposals.findFirst({
    where: and(
      eq(disposals.organizationId, input.organizationId),
      eq(disposals.assetId, input.assetId),
    ),
  });

  if (existingDisposal) {
    throw new Error("A disposal record already exists for this asset");
  }

  const [disposal] = await db
    .insert(disposals)
    .values({
      organizationId: input.organizationId,
      assetId: input.assetId,

      reason: input.reason,

      disposalDate: new Date(input.disposalDate),

      disposalMethod: input.disposalMethod,

      approvedBy: input.approvedBy,
      disposedBy: input.disposedBy,

      residualValue: input.residualValue,

      remarks: input.remarks,
    })
    .returning();

  if (!disposal) {
    throw new Error("Failed to create disposal record");
  }

  return disposal;
}

export async function updateDisposal(
  organizationId: string,
  disposalId: string,
  input: UpdateDisposalInput,
) {
  await getDisposalById(organizationId, disposalId);

  const [disposal] = await db
    .update(disposals)
    .set({
      reason: input.reason,

      disposalDate:
        input.disposalDate !== undefined
          ? new Date(input.disposalDate)
          : undefined,

      disposalMethod: input.disposalMethod,

      approvedBy: input.approvedBy,
      disposedBy: input.disposedBy,

      residualValue: input.residualValue,

      remarks: input.remarks,

      updatedAt: new Date(),
    })
    .where(
      and(
        eq(disposals.id, disposalId),
        eq(disposals.organizationId, organizationId),
      ),
    )
    .returning();

  if (!disposal) {
    throw new Error("Failed to update disposal record");
  }

  return disposal;
}

export async function deleteDisposal(
  organizationId: string,
  disposalId: string,
) {
  await getDisposalById(organizationId, disposalId);

  await db
    .delete(disposals)
    .where(
      and(
        eq(disposals.id, disposalId),
        eq(disposals.organizationId, organizationId),
      ),
    );

  return true;
}
