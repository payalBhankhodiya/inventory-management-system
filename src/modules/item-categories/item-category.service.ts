import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { itemCategories } from "../../db/schema/item-category.js";

import type {
  CreateItemCategoryInput,
  ItemCategoriesListQuery,
  UpdateItemCategoryInput,
} from "./item-category.schema.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";
import { AuditInfo } from "../../types/audit.js";

export async function getItemCategories(
  organizationId: string,
  query: ItemCategoriesListQuery,
) {
  const conditions = [eq(itemCategories.organizationId, organizationId)];

  if (query.search) {
    conditions.push(
      or(
        ilike(itemCategories.name, `%${query.search}%`),
        ilike(itemCategories.code, `%${query.search}%`),
        ilike(itemCategories.description, `%${query.search}%`),
      )!,
    );
  }

  if (query.status) {
    conditions.push(eq(itemCategories.status, query.status));
  }

  if (query.parentId) {
    conditions.push(eq(itemCategories.parentId, query.parentId));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(itemCategories)
    .where(and(...conditions))
    .orderBy(desc(itemCategories.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(itemCategories)
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

export async function getItemCategoryById(
  organizationId: string,
  itemCategoryId: string,
) {
  const itemCategory = await db.query.itemCategories.findFirst({
    where: and(
      eq(itemCategories.id, itemCategoryId),
      eq(itemCategories.organizationId, organizationId),
    ),
  });

  if (!itemCategory) {
    throw new Error("Item category not found");
  }

  return itemCategory;
}

export async function createItemCategory(
  input: CreateItemCategoryInput,
  auditInfo: AuditInfo,
) {
  const existingCategory = await db.query.itemCategories.findFirst({
    where: and(
      eq(itemCategories.organizationId, input.organizationId),
      eq(itemCategories.code, input.code),
    ),
  });

  if (existingCategory) {
    throw new Error("Item category with this code already exists");
  }

  if (input.parentId) {
    const parentCategory = await db.query.itemCategories.findFirst({
      where: and(
        eq(itemCategories.id, input.parentId),
        eq(itemCategories.organizationId, input.organizationId),
      ),
    });

    if (!parentCategory) {
      throw new Error("Parent item category not found");
    }
  }

  const [itemCategory] = await db
    .insert(itemCategories)
    .values({
      organizationId: input.organizationId,
      parentId: input.parentId,
      name: input.name,
      code: input.code,
      description: input.description,
      status: input.status,
    })
    .returning();

  if (!itemCategory) {
    throw new Error("Failed to create item category");
  }

  await createAuditLog({
    organizationId: itemCategory.organizationId,
    userId: auditInfo.userId,
    action: "CREATE",
    entityType: "ITEM_CATEGORY",
    entityId: itemCategory.id,
    oldValue: null,
    newValue: itemCategory,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return itemCategory;
}

export async function updateItemCategory(
  organizationId: string,
  itemCategoryId: string,
  input: UpdateItemCategoryInput,
  auditInfo: AuditInfo,
) {
  const existingItemCategory = await db.query.itemCategories.findFirst({
    where: and(
      eq(itemCategories.id, itemCategoryId),
      eq(itemCategories.organizationId, organizationId),
    ),
  });

  if (!existingItemCategory) {
    throw new Error("Item category not found");
  }

  if (input.code && input.code !== existingItemCategory.code) {
    const duplicateCategory = await db.query.itemCategories.findFirst({
      where: and(
        eq(itemCategories.organizationId, organizationId),
        eq(itemCategories.code, input.code),
      ),
    });

    if (duplicateCategory) {
      throw new Error("Item category with this code already exists");
    }
  }

  if (input.parentId) {
    if (input.parentId === itemCategoryId) {
      throw new Error("Item category cannot be its own parent");
    }

    const parentCategory = await db.query.itemCategories.findFirst({
      where: and(
        eq(itemCategories.id, input.parentId),
        eq(itemCategories.organizationId, organizationId),
      ),
    });

    if (!parentCategory) {
      throw new Error("Parent item category not found");
    }
  }

  const [itemCategory] = await db
    .update(itemCategories)
    .set({
      name: input.name,
      code: input.code,
      description: input.description,
      parentId: input.parentId,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(itemCategories.id, itemCategoryId),
        eq(itemCategories.organizationId, organizationId),
      ),
    )
    .returning();

  if (!itemCategory) {
    throw new Error("Failed to update item category");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "ITEM_CATEGORY",
    entityId: itemCategory.id,
    oldValue: existingItemCategory,
    newValue: itemCategory,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return itemCategory;
}

export async function deleteItemCategory(
  organizationId: string,
  itemCategoryId: string,
  auditInfo: AuditInfo,
) {
  const existingItemCategory = await db.query.itemCategories.findFirst({
    where: and(
      eq(itemCategories.id, itemCategoryId),
      eq(itemCategories.organizationId, organizationId),
    ),
  });

  if (!existingItemCategory) {
    throw new Error("Item category not found");
  }

  if (existingItemCategory.status === "INACTIVE") {
    throw new Error("Item category is already inactive");
  }

  const [itemCategory] = await db
    .update(itemCategories)
    .set({
      status: "INACTIVE",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(itemCategories.id, itemCategoryId),
        eq(itemCategories.organizationId, organizationId),
      ),
    )
    .returning();

  if (!itemCategory) {
    throw new Error("Failed to deactivate item category");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "DELETE",
    entityType: "ITEM_CATEGORY",
    entityId: itemCategory.id,
    oldValue: existingItemCategory,
    newValue: itemCategory,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return itemCategory;
}
