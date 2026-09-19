import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { inventories } from "../../db/schema/inventory.js";

import type {
  CreateInventoryInput,
  InventoriesListQuery,
  UpdateInventoryInput,
} from "./inventory.schema.js";
import { AuditInfo } from "../../types/audit.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";

export async function getInventories(
  organizationId: string,
  query: InventoriesListQuery,
) {
  const conditions = [eq(inventories.organizationId, organizationId)];

  if (query.itemId) {
    conditions.push(eq(inventories.itemId, query.itemId));
  }

  if (query.storageAreaId) {
    conditions.push(eq(inventories.storageAreaId, query.storageAreaId));
  }

  if (query.storageUnitId) {
    conditions.push(eq(inventories.storageUnitId, query.storageUnitId));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(inventories)
    .where(and(...conditions))
    .orderBy(desc(inventories.updatedAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(inventories)
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

export async function getInventoryById(
  organizationId: string,
  inventoryId: string,
) {
  const inventory = await db.query.inventories.findFirst({
    where: and(
      eq(inventories.id, inventoryId),
      eq(inventories.organizationId, organizationId),
    ),
  });

  if (!inventory) {
    throw new Error("Inventory not found");
  }

  return inventory;
}

export async function createInventory(
  input: CreateInventoryInput,
  auditInfo: AuditInfo,
) {
  const existingInventory = await db.query.inventories.findFirst({
    where: and(
      eq(inventories.organizationId, input.organizationId),
      eq(inventories.itemId, input.itemId),
      eq(inventories.storageAreaId, input.storageAreaId),
      eq(inventories.storageUnitId, input.storageUnitId),
    ),
  });

  if (existingInventory) {
    throw new Error(
      "Inventory already exists for this item and storage location",
    );
  }

  const [inventory] = await db
    .insert(inventories)
    .values({
      organizationId: input.organizationId,
      itemId: input.itemId,
      storageAreaId: input.storageAreaId,
      storageUnitId: input.storageUnitId,

      quantity: input.quantity,
      reservedQuantity: input.reservedQuantity,
      availableQuantity: input.availableQuantity,

      minimumStock: input.minimumStock,
      reorderLevel: input.reorderLevel,
    })
    .returning();

  if (!inventory) {
    throw new Error("Failed to create inventory");
  }

  await createAuditLog({
    organizationId: inventory.organizationId,
    userId: auditInfo.userId,
    action: "CREATE",
    entityType: "INVENTORY",
    entityId: inventory.id,
    oldValue: null,
    newValue: inventory,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return inventory;
}

export async function updateInventory(
  organizationId: string,
  inventoryId: string,
  input: UpdateInventoryInput,
  auditInfo: AuditInfo,
) {
  const existingInventory = await db.query.inventories.findFirst({
    where: and(
      eq(inventories.id, inventoryId),
      eq(inventories.organizationId, organizationId),
    ),
  });

  if (!existingInventory) {
    throw new Error("Inventory not found");
  }

  const [inventory] = await db
    .update(inventories)
    .set({
      quantity: input.quantity,
      reservedQuantity: input.reservedQuantity,
      availableQuantity: input.availableQuantity,

      minimumStock: input.minimumStock,
      reorderLevel: input.reorderLevel,

      updatedAt: new Date(),
    })
    .where(
      and(
        eq(inventories.id, inventoryId),
        eq(inventories.organizationId, organizationId),
      ),
    )
    .returning();

  if (!inventory) {
    throw new Error("Failed to update inventory");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "INVENTORY",
    entityId: inventory.id,
    oldValue: existingInventory,
    newValue: inventory,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return inventory;
}

export async function deleteInventory(
  organizationId: string,
  inventoryId: string,
  auditInfo: AuditInfo,
) {
  const existingInventory = await db.query.inventories.findFirst({
    where: and(
      eq(inventories.id, inventoryId),
      eq(inventories.organizationId, organizationId),
    ),
  });

  if (!existingInventory) {
    throw new Error("Inventory not found");
  }

  const [inventory] = await db
    .delete(inventories)
    .where(
      and(
        eq(inventories.id, inventoryId),
        eq(inventories.organizationId, organizationId),
      ),
    )
    .returning();

  if (!inventory) {
    throw new Error("Failed to delete inventory");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "DELETE",
    entityType: "INVENTORY",
    entityId: inventoryId,
    oldValue: existingInventory,
    newValue: null,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return inventory;
}
