import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import {
  permissions,
  rolePermissions,
} from "../db/schema/index.js";

export function requirePermission(
  module: string,
  action: string,
) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const user = request.user;

    if (!user?.roleId) {
      return reply.status(403).send({
        success: false,
        message: "Role not found",
      });
    }

    const permission = await db
      .select({
        id: permissions.id,
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
        and(
          eq(
            rolePermissions.roleId,
            user.roleId,
          ),
          eq(permissions.module, module),
          eq(permissions.action, action),
        ),
      )
      .limit(1);

    if (permission.length === 0) {
      return reply.status(403).send({
        success: false,
        message: "Permission denied",
      });
    }
  };
}