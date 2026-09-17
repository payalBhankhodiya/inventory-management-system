import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { permissions } from "../../db/schema/permission.js";

import type {
  CreatePermissionInput,
  PermissionListQuery,
  UpdatePermissionInput,
} from "./permission.schema.js";

export async function getPermissions(query: PermissionListQuery) {
  const conditions = [];

  if (query.search) {
    conditions.push(
      or(
        ilike(permissions.name, `%${query.search}%`),
        ilike(permissions.description, `%${query.search}%`),
        ilike(permissions.module, `%${query.search}%`),
        ilike(permissions.action, `%${query.search}%`),
      )!,
    );
  }

  if (query.module) {
    conditions.push(eq(permissions.module, query.module));
  }

  if (query.action) {
    conditions.push(eq(permissions.action, query.action));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(permissions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(permissions.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(permissions)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

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

export async function getPermissionById(permissionId: string) {
  const permission = await db.query.permissions.findFirst({
    where: eq(permissions.id, permissionId),
  });

  if (!permission) {
    throw new Error("Permission not found");
  }

  return permission;
}

export async function createPermission(input: CreatePermissionInput) {
  const existing = await db.query.permissions.findFirst({
    where: and(
      eq(permissions.module, input.module),
      eq(permissions.action, input.action),
    ),
  });

  if (existing) {
    throw new Error("Permission for this module and action already exists");
  }

  const [permission] = await db
    .insert(permissions)
    .values({
      name: input.name,
      description: input.description,
      module: input.module,
      action: input.action,
    })
    .returning();

  if (!permission) {
    throw new Error("Failed to create permission");
  }

  return permission;
}

export async function updatePermission(
  permissionId: string,
  input: UpdatePermissionInput,
) {
  await getPermissionById(permissionId);

  if (input.module !== undefined || input.action !== undefined) {
    const current = await getPermissionById(permissionId);

    const module = input.module ?? current.module;
    const action = input.action ?? current.action;

    const existing = await db.query.permissions.findFirst({
      where: and(
        eq(permissions.module, module),
        eq(permissions.action, action),
        sql`${permissions.id} <> ${permissionId}`,
      ),
    });

    if (existing) {
      throw new Error("Permission for this module and action already exists");
    }
  }

  const [permission] = await db
    .update(permissions)
    .set({
      name: input.name,
      description: input.description,
      module: input.module,
      action: input.action,
      updatedAt: new Date(),
    })
    .where(eq(permissions.id, permissionId))
    .returning();

  if (!permission) {
    throw new Error("Failed to update permission");
  }

  return permission;
}

export async function deletePermission(permissionId: string) {
  await getPermissionById(permissionId);

  await db.delete(permissions).where(eq(permissions.id, permissionId));

  return true;
}
