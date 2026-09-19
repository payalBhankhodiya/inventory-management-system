import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createStorageArea,
  deleteStorageArea,
  getStorageAreaById,
  getStorageAreas,
  updateStorageArea,
} from "./storage-area.service.js";

import {
  createStorageAreaSchema,
  errorResponseSchema,
  storageAreaDeleteResponseSchema,
  storageAreaIdParamSchema,
  storageAreaSingleResponseSchema,
  storageAreasListQuerySchema,
  storageAreasListResponseSchema,
  updateStorageAreaSchema,
} from "./storage-area.schema.js";

export const storageAreaRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Get all storage areas
  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Storage Areas"],
        querystring: storageAreasListQuerySchema,
        response: {
          200: storageAreasListResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await getStorageAreas(
          request.user.organizationId,
          request.query,
        );

        return reply.send({
          success: true,
          message: "Storage areas fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch storage areas",
        });
      }
    },
  );

  // Get storage area by ID
  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Storage Areas"],
        params: storageAreaIdParamSchema,
        response: {
          200: storageAreaSingleResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const storageArea = await getStorageAreaById(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Storage area fetched successfully",
          data: storageArea,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Storage area not found",
        });
      }
    },
  );

  // Create storage area
  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Storage Areas"],
        body: createStorageAreaSchema,
        response: {
          201: storageAreaSingleResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const storageArea = await createStorageArea(request.body, {
          userId: request.user.userId,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        });
        return reply.status(201).send({
          success: true,
          message: "Storage area created successfully",
          data: storageArea,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create storage area",
        });
      }
    },
  );

  // Update storage area
  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Storage Areas"],
        params: storageAreaIdParamSchema,
        body: updateStorageAreaSchema,
        response: {
          200: storageAreaSingleResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const storageArea = await updateStorageArea(
          request.user.organizationId,
          request.params.id,
          request.body,
          {
            userId: request.user.userId,
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"] ?? null,
          },
        );

        return reply.send({
          success: true,
          message: "Storage area updated successfully",
          data: storageArea,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update storage area",
        });
      }
    },
  );

  // Deactivate storage area
  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Storage Areas"],
        params: storageAreaIdParamSchema,
        response: {
          200: storageAreaDeleteResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteStorageArea(
          request.user.organizationId,
          request.params.id,
          {
            userId: request.user.userId,
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"] ?? null,
          },
        );

        return reply.send({
          success: true,
          message: "Storage area deactivated successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to deactivate storage area",
        });
      }
    },
  );
};
