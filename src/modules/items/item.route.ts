import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createItemSchema,
  deleteItemResponseSchema,
  itemErrorResponseSchema,
  itemIdParamSchema,
  itemSingleResponseSchema,
  itemsListQuerySchema,
  itemsListResponseSchema,
  updateItemSchema,
} from "./item.schema.js";

import {
  createItem,
  deleteItem,
  getItemById,
  getItems,
  updateItem,
} from "./item.service.js";

export const itemRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Items"],
        querystring: itemsListQuerySchema,
        response: {
          200: itemsListResponseSchema,
          400: itemErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const organizationId = request.user.organizationId;

        const result = await getItems(
          organizationId,
          request.query,
        );

        return reply.send({
          success: true,
          message: "Items fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch items",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Items"],
        params: itemIdParamSchema,
        response: {
          200: itemSingleResponseSchema,
          400: itemErrorResponseSchema,
          404: itemErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const item = await getItemById(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Item fetched successfully",
          data: item,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Item not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Items"],
        body: createItemSchema,
        response: {
          201: itemSingleResponseSchema,
          400: itemErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const item = await createItem(request.body);

        return reply.status(201).send({
          success: true,
          message: "Item created successfully",
          data: item,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create item",
        });
      }
    },
  );

  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Items"],
        params: itemIdParamSchema,
        body: updateItemSchema,
        response: {
          200: itemSingleResponseSchema,
          400: itemErrorResponseSchema,
          404: itemErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const item = await updateItem(
          request.user.organizationId,
          request.params.id,
          request.body,
        );

        return reply.send({
          success: true,
          message: "Item updated successfully",
          data: item,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update item",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Items"],
        params: itemIdParamSchema,
        response: {
          200: deleteItemResponseSchema,
          400: itemErrorResponseSchema,
          404: itemErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteItem(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Item deactivated successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to deactivate item",
        });
      }
    },
  );
};