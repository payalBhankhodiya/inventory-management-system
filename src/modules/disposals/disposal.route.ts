import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createDisposalSchema,
  disposalDeleteResponseSchema,
  disposalErrorResponseSchema,
  disposalIdParamSchema,
  disposalListQuerySchema,
  disposalListResponseSchema,
  disposalSingleResponseSchema,
  updateDisposalSchema,
} from "./disposal.schema.js";

import {
  createDisposal,
  deleteDisposal,
  getDisposalById,
  getDisposals,
  updateDisposal,
} from "./disposal.service.js";

export const disposalRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Disposals"],
        querystring: disposalListQuerySchema,
        response: {
          200: disposalListResponseSchema,
          400: disposalErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await getDisposals(
          request.user.organizationId,
          request.query,
        );

        return reply.send({
          success: true,
          message: "Disposal records fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch disposal records",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Disposals"],
        params: disposalIdParamSchema,
        response: {
          200: disposalSingleResponseSchema,
          404: disposalErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const disposal = await getDisposalById(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Disposal record fetched successfully",
          data: disposal,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Disposal record not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Disposals"],
        body: createDisposalSchema,
        response: {
          201: disposalSingleResponseSchema,
          400: disposalErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const disposal = await createDisposal(request.body, {
          userId: request.user.userId,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        });

        return reply.status(201).send({
          success: true,
          message: "Disposal record created successfully",
          data: disposal,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create disposal record",
        });
      }
    },
  );

  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Disposals"],
        params: disposalIdParamSchema,
        body: updateDisposalSchema,
        response: {
          200: disposalSingleResponseSchema,
          400: disposalErrorResponseSchema,
          404: disposalErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const disposal = await updateDisposal(
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
          message: "Disposal record updated successfully",
          data: disposal,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update disposal record",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Disposals"],
        params: disposalIdParamSchema,
        response: {
          200: disposalDeleteResponseSchema,
          400: disposalErrorResponseSchema,
          404: disposalErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteDisposal(request.user.organizationId, request.params.id, {
          userId: request.user.userId,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        });

        return reply.send({
          success: true,
          message: "Disposal record deleted successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete disposal record",
        });
      }
    },
  );
};
