import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { items } from "../../db/schema/item.js";

import type {
  CreateItemInput,
  ItemsListQuery,
  UpdateItemInput,
} from "./item.schema.js";

export async function getItems(
  organizationId: string,
  query: ItemsListQuery,
) {
  const conditions = [eq(items.organizationId, organizationId)];

  if (query.search) {
    conditions.push(
      or(
        ilike(items.name, `%${query.search}%`),
        ilike(items.code, `%${query.search}%`),
        ilike(items.sku, `%${query.search}%`),
        ilike(items.brand, `%${query.search}%`),
        ilike(items.model, `%${query.search}%`),
      )!,
    );
  }

  if (query.status) {
    conditions.push(eq(items.status, query.status));
  }

  if (query.itemType) {
    conditions.push(eq(items.itemType, query.itemType));
  }

  if (query.categoryId) {
    conditions.push(eq(items.categoryId, query.categoryId));
  }

  if (query.unitOfMeasureId) {
    conditions.push(eq(items.unitOfMeasureId, query.unitOfMeasureId));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(items)
    .where(and(...conditions))
    .orderBy(desc(items.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(items)
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

export async function getItemById(
  organizationId: string,
  itemId: string,
) {
  const item = await db.query.items.findFirst({
    where: and(
      eq(items.id, itemId),
      eq(items.organizationId, organizationId),
    ),
  });

  if (!item) {
    throw new Error("Item not found");
  }

  return item;
}

export async function createItem(input: CreateItemInput) {
  const existingCode = await db.query.items.findFirst({
    where: and(
      eq(items.organizationId, input.organizationId),
      eq(items.code, input.code),
    ),
  });

  if (existingCode) {
    throw new Error("Item with this code already exists");
  }

  const existingSku = await db.query.items.findFirst({
    where: and(
      eq(items.organizationId, input.organizationId),
      eq(items.sku, input.sku),
    ),
  });

  if (existingSku) {
    throw new Error("Item with this SKU already exists");
  }

  const [item] = await db
    .insert(items)
    .values({
      organizationId: input.organizationId,
      categoryId: input.categoryId,
      unitOfMeasureId: input.unitOfMeasureId,

      name: input.name,
      code: input.code,
      sku: input.sku,
      description: input.description,

      brand: input.brand,
      model: input.model,

      itemType: input.itemType,
      isTrackable: input.isTrackable,
      isSerialized: input.isSerialized,
      isBatchTracked: input.isBatchTracked,

      minimumStock: input.minimumStock,
      maximumStock: input.maximumStock,
      reorderLevel: input.reorderLevel,

      status: input.status,
    })
    .returning();

  if (!item) {
    throw new Error("Failed to create item");
  }

  return item;
}

export async function updateItem(
  organizationId: string,
  itemId: string,
  input: UpdateItemInput,
) {
  const existingItem = await getItemById(organizationId, itemId);

  if (input.code && input.code !== existingItem.code) {
    const existingCode = await db.query.items.findFirst({
      where: and(
        eq(items.organizationId, organizationId),
        eq(items.code, input.code),
      ),
    });

    if (existingCode) {
      throw new Error("Item with this code already exists");
    }
  }

  if (input.sku && input.sku !== existingItem.sku) {
    const existingSku = await db.query.items.findFirst({
      where: and(
        eq(items.organizationId, organizationId),
        eq(items.sku, input.sku),
      ),
    });

    if (existingSku) {
      throw new Error("Item with this SKU already exists");
    }
  }

  const [item] = await db
    .update(items)
    .set({
      categoryId: input.categoryId,
      unitOfMeasureId: input.unitOfMeasureId,

      name: input.name,
      code: input.code,
      sku: input.sku,
      description: input.description,

      brand: input.brand,
      model: input.model,

      itemType: input.itemType,
      isTrackable: input.isTrackable,
      isSerialized: input.isSerialized,
      isBatchTracked: input.isBatchTracked,

      minimumStock: input.minimumStock,
      maximumStock: input.maximumStock,
      reorderLevel: input.reorderLevel,

      status: input.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(items.id, itemId),
        eq(items.organizationId, organizationId),
      ),
    )
    .returning();

  if (!item) {
    throw new Error("Failed to update item");
  }

  return item;
}

export async function deleteItem(
  organizationId: string,
  itemId: string,
) {
  const existingItem = await getItemById(organizationId, itemId);

  if (existingItem.status === "INACTIVE") {
    throw new Error("Item is already inactive");
  }

  const [item] = await db
    .update(items)
    .set({
      status: "INACTIVE",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(items.id, itemId),
        eq(items.organizationId, organizationId),
      ),
    )
    .returning();

  if (!item) {
    throw new Error("Failed to deactivate item");
  }

  return item;
}