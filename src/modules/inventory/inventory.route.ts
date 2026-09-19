import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createInventorySchema,
  deleteInventoryResponseSchema,
  inventoriesListQuerySchema,
  inventoriesListResponseSchema,
  inventoryErrorResponseSchema,
  inventoryIdParamSchema,
  inventorySingleResponseSchema,
  updateInventorySchema,
} from "./inventory.schema.js";

import {
  createInventory,
  deleteInventory,
  getInventories,
  getInventoryById,
  updateInventory,
} from "./inventory.service.js";

export const inventoryRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Inventory"],
        querystring: inventoriesListQuerySchema,
        response: {
          200: inventoriesListResponseSchema,
          400: inventoryErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await getInventories(
          request.user.organizationId,
          request.query,
        );

        return reply.send({
          success: true,
          message: "Inventory records fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch inventory",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Inventory"],
        params: inventoryIdParamSchema,
        response: {
          200: inventorySingleResponseSchema,
          400: inventoryErrorResponseSchema,
          404: inventoryErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const inventory = await getInventoryById(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Inventory record fetched successfully",
          data: inventory,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Inventory not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Inventory"],
        body: createInventorySchema,
        response: {
          201: inventorySingleResponseSchema,
          400: inventoryErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const inventory = await createInventory(request.body, {
          userId: request.user.userId,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        });
        return reply.status(201).send({
          success: true,
          message: "Inventory created successfully",
          data: inventory,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create inventory",
        });
      }
    },
  );

  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Inventory"],
        params: inventoryIdParamSchema,
        body: updateInventorySchema,
        response: {
          200: inventorySingleResponseSchema,
          400: inventoryErrorResponseSchema,
          404: inventoryErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const inventory = await updateInventory(
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
          message: "Inventory updated successfully",
          data: inventory,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update inventory",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Inventory"],
        params: inventoryIdParamSchema,
        response: {
          200: deleteInventoryResponseSchema,
          400: inventoryErrorResponseSchema,
          404: inventoryErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteInventory(request.user.organizationId, request.params.id, {
          userId: request.user.userId,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        });
        return reply.send({
          success: true,
          message: "Inventory deleted successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete inventory",
        });
      }
    },
  );
};
