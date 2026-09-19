import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { assets } from "../../db/schema/asset.js";

import type {
  AssetsListQuery,
  CreateAssetInput,
  UpdateAssetInput,
} from "./asset.schema.js";
import { AuditInfo } from "../../types/audit.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";

export async function getAssets(
  organizationId: string,
  query: AssetsListQuery,
) {
  const conditions = [eq(assets.organizationId, organizationId)];

  if (query.search) {
    conditions.push(
      or(
        ilike(assets.assetTag, `%${query.search}%`),
        ilike(assets.serialNumber, `%${query.search}%`),
        ilike(assets.barcode, `%${query.search}%`),
      )!,
    );
  }

  if (query.condition) {
    conditions.push(eq(assets.condition, query.condition));
  }

  if (query.status) {
    conditions.push(eq(assets.status, query.status));
  }

  if (query.itemId) {
    conditions.push(eq(assets.itemId, query.itemId));
  }

  if (query.vendorId) {
    conditions.push(eq(assets.vendorId, query.vendorId));
  }

  if (query.siteId) {
    conditions.push(eq(assets.siteId, query.siteId));
  }

  if (query.departmentId) {
    conditions.push(eq(assets.departmentId, query.departmentId));
  }

  if (query.storageAreaId) {
    conditions.push(eq(assets.storageAreaId, query.storageAreaId));
  }

  if (query.storageUnitId) {
    conditions.push(eq(assets.storageUnitId, query.storageUnitId));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(assets)
    .where(and(...conditions))
    .orderBy(desc(assets.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(assets)
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

export async function getAssetById(organizationId: string, assetId: string) {
  const asset = await db.query.assets.findFirst({
    where: and(
      eq(assets.id, assetId),
      eq(assets.organizationId, organizationId),
    ),
  });

  if (!asset) {
    throw new Error("Asset not found");
  }

  return asset;
}

export async function createAsset(
  input: CreateAssetInput,
  auditInfo: AuditInfo,
) {
  const existingAsset = await db.query.assets.findFirst({
    where: eq(assets.assetTag, input.assetTag),
  });

  if (existingAsset) {
    throw new Error("Asset with this asset tag already exists");
  }

  const [asset] = await db
    .insert(assets)
    .values({
      organizationId: input.organizationId,
      itemId: input.itemId,

      assetTag: input.assetTag,
      serialNumber: input.serialNumber,
      barcode: input.barcode,

      vendorId: input.vendorId,

      purchaseDate: input.purchaseDate,
      purchasePrice: input.purchasePrice,

      warrantyStartDate: input.warrantyStartDate,
      warrantyEndDate: input.warrantyEndDate,

      condition: input.condition,
      status: input.status,

      siteId: input.siteId,
      departmentId: input.departmentId,
      storageAreaId: input.storageAreaId,
      storageUnitId: input.storageUnitId,
    })
    .returning();

  if (!asset) {
    throw new Error("Failed to create asset");
  }

  await createAuditLog({
    organizationId: asset.organizationId,
    userId: auditInfo.userId,
    action: "CREATE",
    entityType: "ASSET",
    entityId: asset.id,
    oldValue: null,
    newValue: asset,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return asset;
}

export async function updateAsset(
  organizationId: string,
  assetId: string,
  input: UpdateAssetInput,
  auditInfo: AuditInfo,
) {
  const existingAsset = await db.query.assets.findFirst({
    where: and(
      eq(assets.id, assetId),
      eq(assets.organizationId, organizationId),
    ),
  });

  if (!existingAsset) {
    throw new Error("Asset not found");
  }

  if (input.assetTag && input.assetTag !== existingAsset.assetTag) {
    const assetTagExists = await db.query.assets.findFirst({
      where: eq(assets.assetTag, input.assetTag),
    });

    if (assetTagExists) {
      throw new Error("Asset with this asset tag already exists");
    }
  }

  const [asset] = await db
    .update(assets)
    .set({
      itemId: input.itemId,

      assetTag: input.assetTag,
      serialNumber: input.serialNumber,
      barcode: input.barcode,

      vendorId: input.vendorId,

      purchaseDate: input.purchaseDate,
      purchasePrice: input.purchasePrice,

      warrantyStartDate: input.warrantyStartDate,
      warrantyEndDate: input.warrantyEndDate,

      condition: input.condition,
      status: input.status,

      siteId: input.siteId,
      departmentId: input.departmentId,
      storageAreaId: input.storageAreaId,
      storageUnitId: input.storageUnitId,

      updatedAt: new Date(),
    })
    .where(
      and(eq(assets.id, assetId), eq(assets.organizationId, organizationId)),
    )
    .returning();

  if (!asset) {
    throw new Error("Failed to update asset");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "ASSET",
    entityId: asset.id,
    oldValue: existingAsset,
    newValue: asset,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return asset;
}

export async function deleteAsset(
  organizationId: string,
  assetId: string,
  auditInfo: AuditInfo,
) {
  const existingAsset = await db.query.assets.findFirst({
    where: and(
      eq(assets.id, assetId),
      eq(assets.organizationId, organizationId),
    ),
  });

  if (!existingAsset) {
    throw new Error("Asset not found");
  }

  if (existingAsset.status === "DISPOSED") {
    throw new Error("Asset is already disposed");
  }

  const [asset] = await db
    .update(assets)
    .set({
      status: "DISPOSED",
      updatedAt: new Date(),
    })
    .where(
      and(eq(assets.id, assetId), eq(assets.organizationId, organizationId)),
    )
    .returning();

  if (!asset) {
    throw new Error("Failed to dispose asset");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "DELETE",
    entityType: "ASSET",
    entityId: assetId,
    oldValue: existingAsset,
    newValue: null,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return asset;
}
