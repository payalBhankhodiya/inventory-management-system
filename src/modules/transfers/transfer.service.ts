import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { transfers } from "../../db/schema/transfer.js";
import { transferItems } from "../../db/schema/transfer-item.js";

import type {
  CreateTransferInput,
  TransfersListQuery,
  UpdateTransferInput,
} from "./transfer.schema.js";
import { AuditInfo } from "../../types/audit.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";

export async function getTransfers(
  organizationId: string,
  query: TransfersListQuery,
) {
  const conditions = [eq(transfers.organizationId, organizationId)];

  if (query.search) {
    conditions.push(
      or(
        ilike(transfers.referenceNo, `%${query.search}%`),
        ilike(transfers.reason, `%${query.search}%`),
        ilike(transfers.remarks, `%${query.search}%`),
      )!,
    );
  }

  if (query.status) {
    conditions.push(eq(transfers.status, query.status));
  }

  if (query.requestedBy) {
    conditions.push(eq(transfers.requestedBy, query.requestedBy));
  }

  if (query.approvedBy) {
    conditions.push(eq(transfers.approvedBy, query.approvedBy));
  }

  if (query.fromStorageAreaId) {
    conditions.push(eq(transfers.fromStorageAreaId, query.fromStorageAreaId));
  }

  if (query.fromStorageUnitId) {
    conditions.push(eq(transfers.fromStorageUnitId, query.fromStorageUnitId));
  }

  if (query.toStorageAreaId) {
    conditions.push(eq(transfers.toStorageAreaId, query.toStorageAreaId));
  }

  if (query.toStorageUnitId) {
    conditions.push(eq(transfers.toStorageUnitId, query.toStorageUnitId));
  }

  const offset = (query.page - 1) * query.limit;

  const transferList = await db
    .select()
    .from(transfers)
    .where(and(...conditions))
    .orderBy(desc(transfers.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(transfers)
    .where(and(...conditions));

  const total = Number(countResult[0]?.count ?? 0);

  const data = await Promise.all(
    transferList.map(async (transfer) => {
      const items = await db
        .select()
        .from(transferItems)
        .where(eq(transferItems.transferId, transfer.id));

      return {
        ...transfer,
        items,
      };
    }),
  );

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

export async function getTransferById(
  organizationId: string,
  transferId: string,
) {
  const transfer = await db.query.transfers.findFirst({
    where: and(
      eq(transfers.id, transferId),
      eq(transfers.organizationId, organizationId),
    ),
  });

  if (!transfer) {
    throw new Error("Transfer not found");
  }

  const items = await db
    .select()
    .from(transferItems)
    .where(eq(transferItems.transferId, transfer.id));

  return {
    ...transfer,
    items,
  };
}

export async function createTransfer(
  input: CreateTransferInput,
  auditInfo: AuditInfo,
) {
  if (
    input.fromStorageAreaId === input.toStorageAreaId &&
    input.fromStorageUnitId === input.toStorageUnitId
  ) {
    throw new Error(
      "Source and destination storage location cannot be the same",
    );
  }

  const existingTransfer = await db.query.transfers.findFirst({
    where: eq(transfers.referenceNo, input.referenceNo),
  });

  if (existingTransfer) {
    throw new Error("Transfer with this reference number already exists");
  }

  const result = await db.transaction(async (tx) => {
    const [transfer] = await tx
      .insert(transfers)
      .values({
        organizationId: input.organizationId,

        referenceNo: input.referenceNo,

        fromStorageAreaId: input.fromStorageAreaId,
        fromStorageUnitId: input.fromStorageUnitId,

        toStorageAreaId: input.toStorageAreaId,
        toStorageUnitId: input.toStorageUnitId,

        requestedBy: input.requestedBy,
        approvedBy: input.approvedBy,

        transferDate: input.transferDate
          ? new Date(input.transferDate)
          : undefined,

        status: input.status,

        reason: input.reason,
        remarks: input.remarks,
      })
      .returning();

    if (!transfer) {
      throw new Error("Failed to create transfer");
    }

    const items = await tx
      .insert(transferItems)
      .values(
        input.items.map((item) => ({
          transferId: transfer.id,
          itemId: item.itemId,
          assetId: item.assetId,
          quantity: item.quantity,
          remarks: item.remarks,
        })),
      )
      .returning();

    return {
      ...transfer,
      items,
    };
  });

  await createAuditLog({
    organizationId: result.organizationId,
    userId: auditInfo.userId,
    action: "CREATE",
    entityType: "TRANSFER",
    entityId: result.id,
    oldValue: null,
    newValue: result,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return result;
}

export async function updateTransfer(
  organizationId: string,
  transferId: string,
  input: UpdateTransferInput,
  auditInfo: AuditInfo,
) {
  const existingTransfer = await db.query.transfers.findFirst({
    where: and(
      eq(transfers.id, transferId),
      eq(transfers.organizationId, organizationId),
    ),
  });

  if (!existingTransfer) {
    throw new Error("Transfer not found");
  }

  const fromArea =
    input.fromStorageAreaId ?? existingTransfer.fromStorageAreaId;

  const fromUnit =
    input.fromStorageUnitId ?? existingTransfer.fromStorageUnitId;

  const toArea = input.toStorageAreaId ?? existingTransfer.toStorageAreaId;

  const toUnit = input.toStorageUnitId ?? existingTransfer.toStorageUnitId;

  if (fromArea === toArea && fromUnit === toUnit) {
    throw new Error(
      "Source and destination storage location cannot be the same",
    );
  }

  const [transfer] = await db
    .update(transfers)
    .set({
      fromStorageAreaId:
        input.fromStorageAreaId ?? existingTransfer.fromStorageAreaId,

      fromStorageUnitId:
        input.fromStorageUnitId ?? existingTransfer.fromStorageUnitId,

      toStorageAreaId:
        input.toStorageAreaId ?? existingTransfer.toStorageAreaId,

      toStorageUnitId:
        input.toStorageUnitId ?? existingTransfer.toStorageUnitId,

      approvedBy: input.approvedBy ?? existingTransfer.approvedBy,

      transferDate:
        input.transferDate !== undefined
          ? input.transferDate === null
            ? null
            : new Date(input.transferDate)
          : existingTransfer.transferDate,

      status: input.status ?? existingTransfer.status,

      reason: input.reason ?? existingTransfer.reason,

      remarks: input.remarks ?? existingTransfer.remarks,

      updatedAt: new Date(),
    })
    .where(
      and(
        eq(transfers.id, transferId),
        eq(transfers.organizationId, organizationId),
      ),
    )
    .returning();

  if (!transfer) {
    throw new Error("Failed to update transfer");
  }

  const items = await db
    .select()
    .from(transferItems)
    .where(eq(transferItems.transferId, transfer.id));

  const result = {
    ...transfer,
    items,
  };

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "TRANSFER",
    entityId: transfer.id,
    oldValue: existingTransfer,
    newValue: result,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return result;
}

export async function deleteTransfer(
  organizationId: string,
  transferId: string,
  auditInfo: AuditInfo,
) {
  const existingTransfer = await db.query.transfers.findFirst({
    where: and(
      eq(transfers.id, transferId),
      eq(transfers.organizationId, organizationId),
    ),
  });

  if (!existingTransfer) {
    throw new Error("Transfer not found");
  }

  if (existingTransfer.status === "CANCELLED") {
    throw new Error("Transfer is already cancelled");
  }

  const [transfer] = await db
    .update(transfers)
    .set({
      status: "CANCELLED",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(transfers.id, transferId),
        eq(transfers.organizationId, organizationId),
      ),
    )
    .returning();

  if (!transfer) {
    throw new Error("Failed to cancel transfer");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "DELETE",
    entityType: "TRANSFER",
    entityId: transferId,
    oldValue: existingTransfer,
    newValue: transfer,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return transfer;
}
