import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createUnitOfMeasure,
  deleteUnitOfMeasure,
  getUnitOfMeasureById,
  getUnitsOfMeasure,
  updateUnitOfMeasure,
} from "./unit-of-measure.service.js";

import {
  createUnitOfMeasureSchema,
  errorResponseSchema,
  unitOfMeasureDeleteResponseSchema,
  unitOfMeasureIdParamSchema,
  unitOfMeasureSingleResponseSchema,
  unitsOfMeasureListQuerySchema,
  unitsOfMeasureListResponseSchema,
  updateUnitOfMeasureSchema,
} from "./unit-of-measure.schema.js";

export const unitOfMeasureRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Units of Measure"],
        querystring: unitsOfMeasureListQuerySchema,
        response: {
          200: unitsOfMeasureListResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await getUnitsOfMeasure(
          request.user.organizationId,
          request.query,
        );

        return reply.send({
          success: true,
          message: "Units of measure fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch units of measure",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Units of Measure"],
        params: unitOfMeasureIdParamSchema,
        response: {
          200: unitOfMeasureSingleResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const unitOfMeasure = await getUnitOfMeasureById(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Unit of measure fetched successfully",
          data: unitOfMeasure,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Unit of measure not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Units of Measure"],
        body: createUnitOfMeasureSchema,
        response: {
          201: unitOfMeasureSingleResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const unitOfMeasure = await createUnitOfMeasure(request.body, {
          userId: request.user.userId,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        });
        return reply.status(201).send({
          success: true,
          message: "Unit of measure created successfully",
          data: unitOfMeasure,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create unit of measure",
        });
      }
    },
  );

  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Units of Measure"],
        params: unitOfMeasureIdParamSchema,
        body: updateUnitOfMeasureSchema,
        response: {
          200: unitOfMeasureSingleResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const unitOfMeasure = await updateUnitOfMeasure(
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
          message: "Unit of measure updated successfully",
          data: unitOfMeasure,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update unit of measure",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Units of Measure"],
        params: unitOfMeasureIdParamSchema,
        response: {
          200: unitOfMeasureDeleteResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteUnitOfMeasure(
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
          message: "Unit of measure deactivated successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to deactivate unit of measure",
        });
      }
    },
  );
};
