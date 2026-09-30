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
import { storageAreas } from "../../db/schema/storage-area.js";
import { storageUnits } from "../../db/schema/storage-unit.js";
import { items } from "../../db/schema/item.js";
import { assets } from "../../db/schema/asset.js";
import { inventories } from "../../db/schema/inventory.js";

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

  const result = await db.transaction(async (tx) => {
    // Validate source and destination storage areas.
    const [fromArea] = await tx
      .select()
      .from(storageAreas)
      .where(
        and(
          eq(storageAreas.id, input.fromStorageAreaId),
          eq(storageAreas.organizationId, input.organizationId),
          eq(storageAreas.status, "ACTIVE"),
        ),
      )
      .limit(1);

    const [toArea] = await tx
      .select()
      .from(storageAreas)
      .where(
        and(
          eq(storageAreas.id, input.toStorageAreaId),
          eq(storageAreas.organizationId, input.organizationId),
          eq(storageAreas.status, "ACTIVE"),
        ),
      )
      .limit(1);

    if (!fromArea || !toArea) {
      throw new Error("Invalid or inactive storage area");
    }

    // Validate units and their relationship to the areas.
    const [fromUnit] = await tx
      .select()
      .from(storageUnits)
      .where(
        and(
          eq(storageUnits.id, input.fromStorageUnitId),
          eq(storageUnits.storageAreaId, input.fromStorageAreaId),
          eq(storageUnits.organizationId, input.organizationId),
          eq(storageUnits.status, "ACTIVE"),
        ),
      )
      .limit(1);

    const [toUnit] = await tx
      .select()
      .from(storageUnits)
      .where(
        and(
          eq(storageUnits.id, input.toStorageUnitId),
          eq(storageUnits.storageAreaId, input.toStorageAreaId),
          eq(storageUnits.organizationId, input.organizationId),
          eq(storageUnits.status, "ACTIVE"),
        ),
      )
      .limit(1);

    if (!fromUnit || !toUnit) {
      throw new Error("Invalid or inactive storage unit");
    }

    // Validate unique item/asset lines and availability.
    const seen = new Set<string>();

    for (const line of input.items) {
      const key = line.assetId
        ? `asset:${line.assetId}`
        : `item:${line.itemId}`;

      if (seen.has(key)) {
        throw new Error("Duplicate item or asset in transfer");
      }
      seen.add(key);

      const [item] = await tx
        .select()
        .from(items)
        .where(
          and(
            eq(items.id, line.itemId),
            eq(items.organizationId, input.organizationId),
            eq(items.status, "ACTIVE"),
          ),
        )
        .limit(1);

      if (!item) {
        throw new Error(`Invalid or inactive item: ${line.itemId}`);
      }

      if (line.assetId) {
        if (Number(line.quantity) !== 1) {
          throw new Error("Asset transfer quantity must be 1");
        }

        const [asset] = await tx
          .select()
          .from(assets)
          .where(
            and(
              eq(assets.id, line.assetId),
              eq(assets.organizationId, input.organizationId),
              eq(assets.itemId, line.itemId),
              eq(assets.storageAreaId, input.fromStorageAreaId),
              eq(assets.storageUnitId, input.fromStorageUnitId),
              eq(assets.status, "AVAILABLE"),
            ),
          )
          .limit(1);

        if (!asset) {
          throw new Error(
            `Asset is not available at the source: ${line.assetId}`,
          );
        }
      } else {
        const [inventory] = await tx
          .select()
          .from(inventories)
          .where(
            and(
              eq(inventories.organizationId, input.organizationId),
              eq(inventories.itemId, line.itemId),
              eq(inventories.storageAreaId, input.fromStorageAreaId),
              eq(inventories.storageUnitId, input.fromStorageUnitId),
            ),
          )
          .limit(1);

        if (
          !inventory ||
          Number(inventory.availableQuantity) < Number(line.quantity)
        ) {
          throw new Error(
            `Insufficient available stock for item: ${line.itemId}`,
          );
        }
      }
    }

    // Check reference number within the organization.
    const [existingTransfer] = await tx
      .select({ id: transfers.id })
      .from(transfers)
      .where(
        and(
          eq(transfers.organizationId, input.organizationId),
          eq(transfers.referenceNo, input.referenceNo),
        ),
      )
      .limit(1);

    if (existingTransfer) {
      throw new Error("Transfer with this reference number already exists");
    }

    const [transfer] = await tx
      .insert(transfers)
      .values({
        organizationId: input.organizationId,
        referenceNo: input.referenceNo,

        fromStorageAreaId: input.fromStorageAreaId,
        fromStorageUnitId: input.fromStorageUnitId,

        toStorageAreaId: input.toStorageAreaId,
        toStorageUnitId: input.toStorageUnitId,

        requestedBy: auditInfo.userId,
        approvedBy: null,

        transferDate: input.transferDate
          ? new Date(input.transferDate)
          : undefined,

        status: "DRAFT",

        reason: input.reason,
        remarks: input.remarks,
      })
      .returning();

    if (!transfer) {
      throw new Error("Failed to create transfer");
    }

    const insertedItems = await tx
      .insert(transferItems)
      .values(
        input.items.map((line) => ({
          transferId: transfer.id,
          itemId: line.itemId,
          assetId: line.assetId ?? null,
          quantity: line.quantity,
          remarks: line.remarks,
        })),
      )
      .returning();

    return {
      ...transfer,
      items: insertedItems,
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
      fromStorageAreaId: input.fromStorageAreaId,
      fromStorageUnitId: input.fromStorageUnitId,
      toStorageAreaId: input.toStorageAreaId,
      toStorageUnitId: input.toStorageUnitId,

      transferDate:
        input.transferDate === undefined
          ? undefined
          : input.transferDate === null
            ? null
            : new Date(input.transferDate),

      reason: input.reason,
      remarks: input.remarks,
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

export async function requestTransfer(
  organizationId: string,
  transferId: string,
  auditInfo: AuditInfo,
) {
  const result = await db.transaction(async (tx) => {
    const [existingTransfer] = await tx
      .select()
      .from(transfers)
      .where(
        and(
          eq(transfers.id, transferId),
          eq(transfers.organizationId, organizationId),
        ),
      )
      .limit(1)
      .for("update");

    if (!existingTransfer) {
      throw new Error("Transfer not found");
    }

    if (existingTransfer.status !== "DRAFT") {
      throw new Error("Only draft transfers can be requested");
    }

    const [updatedTransfer] = await tx
      .update(transfers)
      .set({
        status: "REQUESTED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(transfers.id, transferId),
          eq(transfers.organizationId, organizationId),
        ),
      )
      .returning();

    if (!updatedTransfer) {
      throw new Error("Failed to request transfer");
    }

    const items = await tx
      .select()
      .from(transferItems)
      .where(eq(transferItems.transferId, transferId));

    return {
      oldValue: existingTransfer,
      newValue: {
        ...updatedTransfer,
        items,
      },
    };
  });

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "TRANSFER",
    entityId: transferId,
    oldValue: result.oldValue,
    newValue: result.newValue,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return result.newValue;
}

export async function approveTransfer(
  organizationId: string,
  transferId: string,
  auditInfo: AuditInfo,
) {
  const result = await db.transaction(async (tx) => {
    const [existingTransfer] = await tx
      .select()
      .from(transfers)
      .where(
        and(
          eq(transfers.id, transferId),
          eq(transfers.organizationId, organizationId),
        ),
      )
      .limit(1)
      .for("update");

    if (!existingTransfer) {
      throw new Error("Transfer not found");
    }

    if (existingTransfer.status !== "REQUESTED") {
      throw new Error("Only requested transfers can be approved");
    }

    const [updatedTransfer] = await tx
      .update(transfers)
      .set({
        status: "APPROVED",
        approvedBy: auditInfo.userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(transfers.id, transferId),
          eq(transfers.organizationId, organizationId),
        ),
      )
      .returning();

    if (!updatedTransfer) {
      throw new Error("Failed to approve transfer");
    }

    const updatedItems = await tx
      .select()
      .from(transferItems)
      .where(eq(transferItems.transferId, transferId));

    return {
      oldValue: existingTransfer,
      newValue: {
        ...updatedTransfer,
        items: updatedItems,
      },
    };
  });

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "TRANSFER",
    entityId: transferId,
    oldValue: result.oldValue,
    newValue: result.newValue,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return result.newValue;
}
