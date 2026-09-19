import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createStorageUnit,
  deleteStorageUnit,
  getStorageUnitById,
  getStorageUnits,
  updateStorageUnit,
} from "./storage-unit.service.js";

import {
  createStorageUnitSchema,
  errorResponseSchema,
  storageUnitDeleteResponseSchema,
  storageUnitIdParamSchema,
  storageUnitSingleResponseSchema,
  storageUnitsListQuerySchema,
  storageUnitsListResponseSchema,
  updateStorageUnitSchema,
} from "./storage-unit.schema.js";

export const storageUnitRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Storage Units"],
        querystring: storageUnitsListQuerySchema,
        response: {
          200: storageUnitsListResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await getStorageUnits(
          request.user.organizationId,
          request.query,
        );

        return reply.send({
          success: true,
          message: "Storage units fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch storage units",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Storage Units"],
        params: storageUnitIdParamSchema,
        response: {
          200: storageUnitSingleResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const storageUnit = await getStorageUnitById(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Storage unit fetched successfully",
          data: storageUnit,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Storage unit not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Storage Units"],
        body: createStorageUnitSchema,
        response: {
          201: storageUnitSingleResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const storageUnit = await createStorageUnit(request.body, {
          userId: request.user.userId,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        });
        return reply.status(201).send({
          success: true,
          message: "Storage unit created successfully",
          data: storageUnit,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create storage unit",
        });
      }
    },
  );

  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Storage Units"],
        params: storageUnitIdParamSchema,
        body: updateStorageUnitSchema,
        response: {
          200: storageUnitSingleResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const storageUnit = await updateStorageUnit(
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
          message: "Storage unit updated successfully",
          data: storageUnit,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update storage unit",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Storage Units"],
        params: storageUnitIdParamSchema,
        response: {
          200: storageUnitDeleteResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteStorageUnit(
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
          message: "Storage unit deactivated successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to deactivate storage unit",
        });
      }
    },
  );
};
