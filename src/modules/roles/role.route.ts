import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  assignPermissionsSchema,
  roleDeleteResponseSchema,
  roleIdParamSchema,
  rolePermissionsResponseSchema,
  roleSingleResponseSchema,
  rolesListQuerySchema,
  rolesListResponseSchema,
  createRoleSchema,
  updateRoleSchema,
} from "./role.schema.js";

import {
  assignPermissions,
  createRole,
  deleteRole,
  getRoleById,
  getRolePermissions,
  getRoles,
  updateRole,
} from "./role.service.js";

export const roleRoutes = async (
  app: FastifyInstance,
) => {
  const server =
    app.withTypeProvider<ZodTypeProvider>();

  // Get Roles
  server.get(
    "/",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Roles"],

        querystring: rolesListQuerySchema,

        response: {
          200: rolesListResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await getRoles(
        request.user.organizationId,
        request.query,
      );

      return reply.send({
        success: true,
        message: "Roles retrieved successfully",
        ...result,
      });
    },
  );

  // Get Role
  server.get(
    "/:id",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Roles"],

        params: roleIdParamSchema,

        response: {
          200: roleSingleResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const role = await getRoleById(
        request.user.organizationId,
        request.params.id,
      );

      return reply.send({
        success: true,
        message: "Role retrieved successfully",
        data: role,
      });
    },
  );

  // Create Role
  server.post(
    "/",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Roles"],

        body: createRoleSchema,

        response: {
          201: roleSingleResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const role = await createRole(
        request.body,
      );

      return reply.status(201).send({
        success: true,
        message: "Role created successfully",
        data: role,
      });
    },
  );

  // Update Role
  server.patch(
    "/:id",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Roles"],

        params: roleIdParamSchema,

        body: updateRoleSchema,

        response: {
          200: roleSingleResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const role = await updateRole(
        request.user.organizationId,
        request.params.id,
        request.body,
      );

      return reply.send({
        success: true,
        message: "Role updated successfully",
        data: role,
      });
    },
  );

  // Deactivate Role
  server.delete(
    "/:id",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Roles"],

        params: roleIdParamSchema,

        response: {
          200: roleDeleteResponseSchema,
        },
      },
    },
    async (request, reply) => {
      await deleteRole(
        request.user.organizationId,
        request.params.id,
      );

      return reply.send({
        success: true,
        message: "Role deactivated successfully",
      });
    },
  );

  // Get Role Permissions
  server.get(
    "/:id/permissions",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Roles"],

        params: roleIdParamSchema,

        response: {
          200: rolePermissionsResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const permissions =
        await getRolePermissions(
          request.user.organizationId,
          request.params.id,
        );

      return reply.send({
        success: true,
        message:
          "Role permissions retrieved successfully",
        data: permissions,
      });
    },
  );

  // Assign Permissions
  server.put(
    "/:id/permissions",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Roles"],

        params: roleIdParamSchema,

        body: assignPermissionsSchema,

        response: {
          200: rolePermissionsResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const permissions =
        await assignPermissions(
          request.user.organizationId,
          request.params.id,
          request.body.permissionIds,
        );

      return reply.send({
        success: true,
        message:
          "Role permissions updated successfully",
        data: permissions,
      });
    },
  );
};