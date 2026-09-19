import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createTransferSchema,
  deleteTransferResponseSchema,
  transferErrorResponseSchema,
  transferIdParamSchema,
  transferSingleResponseSchema,
  transfersListQuerySchema,
  transfersListResponseSchema,
  updateTransferSchema,
} from "./transfer.schema.js";

import {
  createTransfer,
  deleteTransfer,
  getTransferById,
  getTransfers,
  updateTransfer,
} from "./transfer.service.js";

export const transferRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Transfers"],
        querystring: transfersListQuerySchema,
        response: {
          200: transfersListResponseSchema,
          400: transferErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await getTransfers(
          request.user.organizationId,
          request.query,
        );

        return reply.send({
          success: true,
          message: "Transfers fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch transfers",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Transfers"],
        params: transferIdParamSchema,
        response: {
          200: transferSingleResponseSchema,
          400: transferErrorResponseSchema,
          404: transferErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const transfer = await getTransferById(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Transfer fetched successfully",
          data: transfer,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Transfer not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Transfers"],
        body: createTransferSchema,
        response: {
          201: transferSingleResponseSchema,
          400: transferErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const transfer = await createTransfer(request.body, {
          userId: request.user.userId,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        });

        return reply.status(201).send({
          success: true,
          message: "Transfer created successfully",
          data: transfer,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create transfer",
        });
      }
    },
  );

  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Transfers"],
        params: transferIdParamSchema,
        body: updateTransferSchema,
        response: {
          200: transferSingleResponseSchema,
          400: transferErrorResponseSchema,
          404: transferErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const transfer = await updateTransfer(
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
          message: "Transfer updated successfully",
          data: transfer,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update transfer",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Transfers"],
        params: transferIdParamSchema,
        response: {
          200: deleteTransferResponseSchema,
          400: transferErrorResponseSchema,
          404: transferErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteTransfer(request.user.organizationId, request.params.id, {
          userId: request.user.userId,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        });
        return reply.send({
          success: true,
          message: "Transfer cancelled successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to cancel transfer",
        });
      }
    },
  );
};
