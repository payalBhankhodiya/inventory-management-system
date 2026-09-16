import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { storageUnits } from "../../db/schema/storage-unit.js";
import type {
  CreateStorageUnitInput,
  StorageUnitsListQuery,
  UpdateStorageUnitInput,
} from "./storage-unit.schema.js";

export async function getStorageUnits(
  organizationId: string,
  query: StorageUnitsListQuery,
) {
  const conditions = [
    eq(storageUnits.organizationId, organizationId),
  ];

  if (query.search) {
    conditions.push(
      or(
        ilike(storageUnits.name, `%${query.search}%`),
        ilike(storageUnits.code, `%${query.search}%`),
        ilike(
          storageUnits.description,
          `%${query.search}%`,
        ),
      )!,
    );
  }

  if (query.status) {
    conditions.push(
      eq(storageUnits.status, query.status),
    );
  }

  if (query.type) {
    conditions.push(
      eq(storageUnits.type, query.type),
    );
  }

  if (query.storageAreaId) {
    conditions.push(
      eq(storageUnits.storageAreaId, query.storageAreaId),
    );
  }

  if (query.parentId) {
    conditions.push(
      eq(storageUnits.parentId, query.parentId),
    );
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(storageUnits)
    .where(and(...conditions))
    .orderBy(desc(storageUnits.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(storageUnits)
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

export async function getStorageUnitById(
  organizationId: string,
  storageUnitId: string,
) {
  const storageUnit = await db.query.storageUnits.findFirst({
    where: and(
      eq(storageUnits.id, storageUnitId),
      eq(storageUnits.organizationId, organizationId),
    ),
  });

  if (!storageUnit) {
    throw new Error("Storage unit not found");
  }

  return storageUnit;
}

export async function createStorageUnit(
  input: CreateStorageUnitInput,
) {
  const existingStorageUnit =
    await db.query.storageUnits.findFirst({
      where: and(
        eq(
          storageUnits.organizationId,
          input.organizationId,
        ),
        eq(storageUnits.code, input.code),
      ),
    });

  if (existingStorageUnit) {
    throw new Error(
      "Storage unit with this code already exists",
    );
  }

  if (input.parentId) {
    const parentUnit =
      await db.query.storageUnits.findFirst({
        where: and(
          eq(storageUnits.id, input.parentId),
          eq(
            storageUnits.organizationId,
            input.organizationId,
          ),
        ),
      });

    if (!parentUnit) {
      throw new Error("Parent storage unit not found");
    }

    if (
      parentUnit.storageAreaId !== input.storageAreaId
    ) {
      throw new Error(
        "Parent storage unit must belong to the same storage area",
      );
    }
  }

  const [storageUnit] = await db
    .insert(storageUnits)
    .values({
      organizationId: input.organizationId,
      storageAreaId: input.storageAreaId,
      parentId: input.parentId,
      name: input.name,
      code: input.code,
      type: input.type,
      description: input.description,
      capacity: input.capacity,
      status: input.status,
    })
    .returning();

  if (!storageUnit) {
    throw new Error("Failed to create storage unit");
  }

  return storageUnit;
}

export async function updateStorageUnit(
  organizationId: string,
  storageUnitId: string,
  input: UpdateStorageUnitInput,
) {
  const existingStorageUnit =
    await getStorageUnitById(
      organizationId,
      storageUnitId,
    );

  if (
    input.code &&
    input.code !== existingStorageUnit.code
  ) {
    const duplicateStorageUnit =
      await db.query.storageUnits.findFirst({
        where: and(
          eq(
            storageUnits.organizationId,
            organizationId,
          ),
          eq(storageUnits.code, input.code),
        ),
      });

    if (duplicateStorageUnit) {
      throw new Error(
        "Storage unit with this code already exists",
      );
    }
  }

  const targetStorageAreaId =
    input.storageAreaId ??
    existingStorageUnit.storageAreaId;

  if (input.parentId) {
    if (input.parentId === storageUnitId) {
      throw new Error(
        "Storage unit cannot be its own parent",
      );
    }

    const parentUnit =
      await db.query.storageUnits.findFirst({
        where: and(
          eq(storageUnits.id, input.parentId),
          eq(
            storageUnits.organizationId,
            organizationId,
          ),
        ),
      });

    if (!parentUnit) {
      throw new Error("Parent storage unit not found");
    }

    if (
      parentUnit.storageAreaId !== targetStorageAreaId
    ) {
      throw new Error(
        "Parent storage unit must belong to the same storage area",
      );
    }
  }

  const [storageUnit] = await db
    .update(storageUnits)
    .set({
      name: input.name,
      code: input.code,
      type: input.type,
      description: input.description,
      capacity: input.capacity,
      storageAreaId: input.storageAreaId,
      parentId: input.parentId,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(storageUnits.id, storageUnitId),
        eq(
          storageUnits.organizationId,
          organizationId,
        ),
      ),
    )
    .returning();

  if (!storageUnit) {
    throw new Error("Failed to update storage unit");
  }

  return storageUnit;
}

export async function deleteStorageUnit(
  organizationId: string,
  storageUnitId: string,
) {
  const existingStorageUnit =
    await getStorageUnitById(
      organizationId,
      storageUnitId,
    );

  if (existingStorageUnit.status === "INACTIVE") {
    throw new Error(
      "Storage unit is already inactive",
    );
  }

  const [storageUnit] = await db
    .update(storageUnits)
    .set({
      status: "INACTIVE",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(storageUnits.id, storageUnitId),
        eq(
          storageUnits.organizationId,
          organizationId,
        ),
      ),
    )
    .returning();

  if (!storageUnit) {
    throw new Error(
      "Failed to deactivate storage unit",
    );
  }

  return storageUnit;
}