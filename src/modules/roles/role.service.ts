import { and, desc, eq, ilike, sql } from "drizzle-orm";

import { db } from "../../db/index.js";

import { roles } from "../../db/schema/role.js";
import { permissions } from "../../db/schema/permission.js";
import { rolePermissions } from "../../db/schema/role-permission.js";

import type {
  CreateRoleInput,
  RolesListQuery,
  UpdateRoleInput,
} from "./role.schema.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";
import { AuditInfo } from "../../types/audit.js";
import { auditLogs } from "../../db/schema/audit-log.js";

export async function getRoles(organizationId: string, query: RolesListQuery) {
  const conditions = [eq(roles.organizationId, organizationId)];

  if (query.search) {
    conditions.push(ilike(roles.name, `%${query.search}%`));
  }

  if (query.status) {
    conditions.push(eq(roles.status, query.status));
  }

  const offset = (query.page - 1) * query.limit;

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

export async function getRoleById(organizationId: string, roleId: string) {
  const role = await db.query.roles.findFirst({
    where: and(eq(roles.id, roleId), eq(roles.organizationId, organizationId)),
  });

  if (!role) {
    throw new Error("Role not found");
  }

  return role;
}

export async function createRole(input: CreateRoleInput, auditInfo: AuditInfo) {
  const existingRole = await db.query.roles.findFirst({
    where: and(
      eq(roles.organizationId, input.organizationId),
      eq(roles.name, input.name),
    ),
  });

  if (existingRole) {
    throw new Error("Role with this name already exists");
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

  await createAuditLog({
    organizationId: role.organizationId,
    userId: auditInfo.userId,
    action: "CREATE",
    entityType: "ROLE",
    entityId: role.id,
    oldValue: null,
    newValue: role,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return role;
}

export async function updateRole(
  organizationId: string,
  roleId: string,
  input: UpdateRoleInput,
  auditInfo: AuditInfo,
) {
  const existingRole = await db.query.roles.findFirst({
    where: and(eq(roles.id, roleId), eq(roles.organizationId, organizationId)),
  });

  if (!existingRole) {
    throw new Error("Role not found");
  }

  if (existingRole.isSystemRole) {
    throw new Error("System role cannot be modified");
  }

  if (input.name && input.name !== existingRole.name) {
    const duplicateRole = await db.query.roles.findFirst({
      where: and(
        eq(roles.organizationId, organizationId),
        eq(roles.name, input.name),
      ),
    });

    if (duplicateRole) {
      throw new Error("Role with this name already exists");
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
    .where(and(eq(roles.id, roleId), eq(roles.organizationId, organizationId)))
    .returning();

  if (!role) {
    throw new Error("Failed to update role");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "ROLE",
    entityId: role.id,
    oldValue: existingRole,
    newValue: role,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return role;
}

export async function deleteRole(
  organizationId: string,
  roleId: string,
  auditInfo: AuditInfo,
) {
  const existingRole = await db.query.roles.findFirst({
    where: and(eq(roles.id, roleId), eq(roles.organizationId, organizationId)),
  });

  if (!existingRole) {
    throw new Error("Role not found");
  }
  if (existingRole.isSystemRole) {
    throw new Error("System role cannot be deactivated");
  }

  if (existingRole.status === "INACTIVE") {
    throw new Error("Role is already inactive");
  }

  const [role] = await db
    .update(roles)
    .set({
      status: "INACTIVE",
      updatedAt: new Date(),
    })
    .where(and(eq(roles.id, roleId), eq(roles.organizationId, organizationId)))
    .returning();

  if (!role) {
    throw new Error("Failed to deactivate role");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "DELETE",
    entityType: "ROLE",
    entityId: role.id,
    oldValue: existingRole,
    newValue: role,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return role;
}

export async function getRolePermissions(
  organizationId: string,
  roleId: string,
) {
  await getRoleById(organizationId, roleId);

  const result = await db
    .select({
      id: permissions.id,
      name: permissions.name,
      module: permissions.module,
      action: permissions.action,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));

  return result;
}

export async function assignPermissions(
  organizationId: string,
  roleId: string,
  permissionIds: string[],
  auditInfo: AuditInfo,
) {
  const role = await db.query.roles.findFirst({
    where: and(
      eq(roles.id, roleId),
      eq(roles.organizationId, organizationId),
    ),
  });

  if (!role) {
    throw new Error("Role not found");
  }

  if (role.isSystemRole) {
    throw new Error("System role permissions cannot be modified");
  }

  const existingPermissions = await db
    .select({
      id: permissions.id,
    })
    .from(permissions)
    .where(sql`${permissions.id} IN ${permissionIds}`);

  if (existingPermissions.length !== permissionIds.length) {
    throw new Error("One or more permissions not found");
  }

  const oldPermissions = await db
    .select({
      permissionId: rolePermissions.permissionId,
    })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId));

  await db.transaction(async (tx) => {
    await tx
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    if (permissionIds.length > 0) {
      await tx.insert(rolePermissions).values(
        permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      );
    }

    await tx.insert(auditLogs).values({
      organizationId,
      userId: auditInfo.userId,
      action: "UPDATE",
      entityType: "ROLE_PERMISSION",
      entityId: roleId,
      oldValue: {
        permissionIds: oldPermissions.map(
          (permission) => permission.permissionId,
        ),
      },
      newValue: {
        permissionIds,
      },
      ipAddress: auditInfo.ipAddress ?? null,
      userAgent: auditInfo.userAgent ?? null,
    });
  });

  return getRolePermissions(organizationId, roleId);
}
