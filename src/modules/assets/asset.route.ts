import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  assetErrorResponseSchema,
  assetIdParamSchema,
  assetSingleResponseSchema,
  assetsListQuerySchema,
  assetsListResponseSchema,
  createAssetSchema,
  deleteAssetResponseSchema,
  updateAssetSchema,
} from "./asset.schema.js";

import {
  createAsset,
  deleteAsset,
  getAssetById,
  getAssets,
  updateAsset,
} from "./asset.service.js";

export const assetRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Assets"],
        querystring: assetsListQuerySchema,
        response: {
          200: assetsListResponseSchema,
          400: assetErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await getAssets(
          request.user.organizationId,
          request.query,
        );

        return reply.send({
          success: true,
          message: "Assets fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to fetch assets",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Assets"],
        params: assetIdParamSchema,
        response: {
          200: assetSingleResponseSchema,
          400: assetErrorResponseSchema,
          404: assetErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const asset = await getAssetById(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Asset fetched successfully",
          data: asset,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message: error instanceof Error ? error.message : "Asset not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Assets"],
        body: createAssetSchema,
        response: {
          201: assetSingleResponseSchema,
          400: assetErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const asset = await createAsset(request.body, {
          userId: request.user.userId,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        });
        return reply.status(201).send({
          success: true,
          message: "Asset created successfully",
          data: asset,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to create asset",
        });
      }
    },
  );

  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Assets"],
        params: assetIdParamSchema,
        body: updateAssetSchema,
        response: {
          200: assetSingleResponseSchema,
          400: assetErrorResponseSchema,
          404: assetErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const asset = await updateAsset(
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
          message: "Asset updated successfully",
          data: asset,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to update asset",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Assets"],
        params: assetIdParamSchema,
        response: {
          200: deleteAssetResponseSchema,
          400: assetErrorResponseSchema,
          404: assetErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteAsset(request.user.organizationId, request.params.id, {
          userId: request.user.userId,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        });
        return reply.send({
          success: true,
          message: "Asset disposed successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to dispose asset",
        });
      }
    },
  );
};
