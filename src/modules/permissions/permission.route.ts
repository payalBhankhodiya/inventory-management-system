import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createPermissionSchema,
  permissionDeleteResponseSchema,
  permissionErrorResponseSchema,
  permissionIdParamSchema,
  permissionListQuerySchema,
  permissionListResponseSchema,
  permissionSingleResponseSchema,
  updatePermissionSchema,
} from "./permission.schema.js";

import {
  createPermission,
  deletePermission,
  getPermissionById,
  getPermissions,
  updatePermission,
} from "./permission.service.js";

export const permissionRoutes = async (
  app: FastifyInstance,
) => {
  const server =
    app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Permissions"],
        querystring:
          permissionListQuerySchema,
        response: {
          200:
            permissionListResponseSchema,
          400:
            permissionErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result =
          await getPermissions(
            request.query,
          );

        return reply.send({
          success: true,
          message:
            "Permissions fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch permissions",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Permissions"],
        params:
          permissionIdParamSchema,
        response: {
          200:
            permissionSingleResponseSchema,
          404:
            permissionErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const permission =
          await getPermissionById(
            request.params.id,
          );

        return reply.send({
          success: true,
          message:
            "Permission fetched successfully",
          data: permission,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Permission not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Permissions"],
        body: createPermissionSchema,
        response: {
          201:
            permissionSingleResponseSchema,
          400:
            permissionErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const permission =
          await createPermission(
            request.body,
          );

        return reply.status(201).send({
          success: true,
          message:
            "Permission created successfully",
          data: permission,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create permission",
        });
      }
    },
  );

  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Permissions"],
        params:
          permissionIdParamSchema,
        body: updatePermissionSchema,
        response: {
          200:
            permissionSingleResponseSchema,
          400:
            permissionErrorResponseSchema,
          404:
            permissionErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const permission =
          await updatePermission(
            request.params.id,
            request.body,
          );

        return reply.send({
          success: true,
          message:
            "Permission updated successfully",
          data: permission,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update permission",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Permissions"],
        params:
          permissionIdParamSchema,
        response: {
          200:
            permissionDeleteResponseSchema,
          400:
            permissionErrorResponseSchema,
          404:
            permissionErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deletePermission(
          request.params.id,
        );

        return reply.send({
          success: true,
          message:
            "Permission deleted successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete permission",
        });
      }
    },
  );
};