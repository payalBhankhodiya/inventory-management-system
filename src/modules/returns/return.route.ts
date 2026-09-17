import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createReturnSchema,
  deleteReturnResponseSchema,
  returnErrorResponseSchema,
  returnIdParamSchema,
  returnSingleResponseSchema,
  returnsListQuerySchema,
  returnsListResponseSchema,
  updateReturnSchema,
} from "./return.schema.js";

import {
  createReturn,
  deleteReturn,
  getReturnById,
  getReturns,
  updateReturn,
} from "./return.service.js";

export const returnRoutes = async (
  app: FastifyInstance,
) => {
  const server =
    app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Returns"],
        querystring:
          returnsListQuerySchema,
        response: {
          200:
            returnsListResponseSchema,
          400:
            returnErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result =
          await getReturns(
            request.user.organizationId,
            request.query,
          );

        return reply.send({
          success: true,
          message:
            "Returns fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch returns",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Returns"],
        params:
          returnIdParamSchema,
        response: {
          200:
            returnSingleResponseSchema,
          400:
            returnErrorResponseSchema,
          404:
            returnErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const returnRecord =
          await getReturnById(
            request.user.organizationId,
            request.params.id,
          );

        return reply.send({
          success: true,
          message:
            "Return fetched successfully",
          data: returnRecord,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Return not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Returns"],
        body: createReturnSchema,
        response: {
          201:
            returnSingleResponseSchema,
          400:
            returnErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const returnRecord =
          await createReturn(
            request.body,
          );

        return reply.status(201).send({
          success: true,
          message:
            "Return created successfully",
          data: returnRecord,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create return",
        });
      }
    },
  );

  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Returns"],
        params:
          returnIdParamSchema,
        body: updateReturnSchema,
        response: {
          200:
            returnSingleResponseSchema,
          400:
            returnErrorResponseSchema,
          404:
            returnErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const returnRecord =
          await updateReturn(
            request.user.organizationId,
            request.params.id,
            request.body,
          );

        return reply.send({
          success: true,
          message:
            "Return updated successfully",
          data: returnRecord,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update return",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Returns"],
        params:
          returnIdParamSchema,
        response: {
          200:
            deleteReturnResponseSchema,
          400:
            returnErrorResponseSchema,
          404:
            returnErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteReturn(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message:
            "Return rejected successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to reject return",
        });
      }
    },
  );
};