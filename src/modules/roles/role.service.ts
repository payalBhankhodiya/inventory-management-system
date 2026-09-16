import {
  and,
  desc,
  eq,
  ilike,
  sql,
} from "drizzle-orm";

import { db } from "../../db/index.js";

import { roles } from "../../db/schema/role.js";
import { permissions } from "../../db/schema/permission.js";
import { rolePermissions } from "../../db/schema/role-permission.js";

import type {
  CreateRoleInput,
  RolesListQuery,
  UpdateRoleInput,
} from "./role.schema.js";

export async function getRoles(
  organizationId: string,
  query: RolesListQuery,
) {
  const conditions = [
    eq(roles.organizationId, organizationId),
  ];

  if (query.search) {
    conditions.push(
      ilike(
        roles.name,
        `%${query.search}%`,
      ),
    );
  }

  if (query.status) {
    conditions.push(
      eq(roles.status, query.status),
    );
  }

  const offset =
    (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(roles)
    .where(and(...conditions))
    .orderBy(desc(roles.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(roles)
    .where(and(...conditions));

  const total = Number(
    countResult[0]?.count ?? 0,
  );

  return {
    data,

    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(
        total / query.limit,
      ),
    },
  };
}

export async function getRoleById(
  organizationId: string,
  roleId: string,
) {
  const role = await db.query.roles.findFirst({
    where: and(
      eq(roles.id, roleId),
      eq(
        roles.organizationId,
        organizationId,
      ),
    ),
  });

  if (!role) {
    throw new Error("Role not found");
  }

  return role;
}

export async function createRole(
  input: CreateRoleInput,
) {
  const existingRole =
    await db.query.roles.findFirst({
      where: and(
        eq(
          roles.organizationId,
          input.organizationId,
        ),
        eq(roles.name, input.name),
      ),
    });

  if (existingRole) {
    throw new Error(
      "Role with this name already exists",
    );
  }

  const [role] = await db
    .insert(roles)
    .values({
      organizationId: input.organizationId,
      name: input.name,
      description: input.description,
      isSystemRole: input.isSystemRole,
      status: input.status,
    })
    .returning();

  if (!role) {
    throw new Error("Failed to create role");
  }

  return role;
}

export async function updateRole(
  organizationId: string,
  roleId: string,
  input: UpdateRoleInput,
) {
  const existingRole =
    await getRoleById(
      organizationId,
      roleId,
    );

  if (existingRole.isSystemRole) {
    throw new Error(
      "System role cannot be modified",
    );
  }

  if (
    input.name &&
    input.name !== existingRole.name
  ) {
    const duplicateRole =
      await db.query.roles.findFirst({
        where: and(
          eq(
            roles.organizationId,
            organizationId,
          ),
          eq(roles.name, input.name),
        ),
      });

    if (duplicateRole) {
      throw new Error(
        "Role with this name already exists",
      );
    }
  }

  const [role] = await db
    .update(roles)
    .set({
      name: input.name,
      description: input.description,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(roles.id, roleId),
        eq(
          roles.organizationId,
          organizationId,
        ),
      ),
    )
    .returning();

  if (!role) {
    throw new Error("Failed to update role");
  }

  return role;
}

export async function deleteRole(
  organizationId: string,
  roleId: string,
) {
  const existingRole =
    await getRoleById(
      organizationId,
      roleId,
    );

  if (existingRole.isSystemRole) {
    throw new Error(
      "System role cannot be deactivated",
    );
  }

  if (existingRole.status === "INACTIVE") {
    throw new Error(
      "Role is already inactive",
    );
  }

  const [role] = await db
    .update(roles)
    .set({
      status: "INACTIVE",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(roles.id, roleId),
        eq(
          roles.organizationId,
          organizationId,
        ),
      ),
    )
    .returning();

  if (!role) {
    throw new Error(
      "Failed to deactivate role",
    );
  }

  return role;
}

export async function getRolePermissions(
  organizationId: string,
  roleId: string,
) {
  await getRoleById(
    organizationId,
    roleId,
  );

  const result = await db
    .select({
      id: permissions.id,
      name: permissions.name,
      module: permissions.module,
      action: permissions.action,
    })
    .from(rolePermissions)
    .innerJoin(
      permissions,
      eq(
        rolePermissions.permissionId,
        permissions.id,
      ),
    )
    .where(
      eq(
        rolePermissions.roleId,
        roleId,
      ),
    );

  return result;
}

export async function assignPermissions(
  organizationId: string,
  roleId: string,
  permissionIds: string[],
) {
  const role = await getRoleById(
    organizationId,
    roleId,
  );

  if (role.isSystemRole) {
    throw new Error(
      "System role permissions cannot be modified",
    );
  }

  const existingPermissions =
    await db
      .select({
        id: permissions.id,
      })
      .from(permissions)
      .where(
        sql`${permissions.id} IN ${permissionIds}`,
      );

  if (
    existingPermissions.length !==
    permissionIds.length
  ) {
    throw new Error(
      "One or more permissions not found",
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(rolePermissions)
      .where(
        eq(
          rolePermissions.roleId,
          roleId,
        ),
      );

    if (permissionIds.length > 0) {
      await tx
        .insert(rolePermissions)
        .values(
          permissionIds.map(
            (permissionId) => ({
              roleId,
              permissionId,
            }),
          ),
        );
    }
  });

  return getRolePermissions(
    organizationId,
    roleId,
  );
}