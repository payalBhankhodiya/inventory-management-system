import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createItemCategory,
  deleteItemCategory,
  getItemCategories,
  getItemCategoryById,
  updateItemCategory,
} from "./item-category.service.js";

import {
  createItemCategorySchema,
  errorResponseSchema,
  itemCategoriesListQuerySchema,
  itemCategoriesListResponseSchema,
  itemCategoryDeleteResponseSchema,
  itemCategoryIdParamSchema,
  itemCategorySingleResponseSchema,
  updateItemCategorySchema,
} from "./item-category.schema.js";

export const itemCategoryRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Item Categories"],
        querystring: itemCategoriesListQuerySchema,
        response: {
          200: itemCategoriesListResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await getItemCategories(
          request.user.organizationId,
          request.query,
        );

        return reply.send({
          success: true,
          message: "Item categories fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch item categories",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Item Categories"],
        params: itemCategoryIdParamSchema,
        response: {
          200: itemCategorySingleResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const itemCategory = await getItemCategoryById(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Item category fetched successfully",
          data: itemCategory,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Item category not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Item Categories"],
        body: createItemCategorySchema,
        response: {
          201: itemCategorySingleResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const itemCategory = await createItemCategory(request.body, {
          userId: request.user.userId,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        });
        return reply.status(201).send({
          success: true,
          message: "Item category created successfully",
          data: itemCategory,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create item category",
        });
      }
    },
  );

  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Item Categories"],
        params: itemCategoryIdParamSchema,
        body: updateItemCategorySchema,
        response: {
          200: itemCategorySingleResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const itemCategory = await updateItemCategory(
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
          message: "Item category updated successfully",
          data: itemCategory,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update item category",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Item Categories"],
        params: itemCategoryIdParamSchema,
        response: {
          200: itemCategoryDeleteResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteItemCategory(
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
          message: "Item category deactivated successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to deactivate item category",
        });
      }
    },
  );
};
