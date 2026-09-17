import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createMaintenanceSchema,
  maintenanceDeleteResponseSchema,
  maintenanceErrorResponseSchema,
  maintenanceIdParamSchema,
  maintenanceListQuerySchema,
  maintenanceListResponseSchema,
  maintenanceSingleResponseSchema,
  updateMaintenanceSchema,
} from "./maintenance.schema.js";

import {
  createMaintenance,
  deleteMaintenance,
  getMaintenanceById,
  getMaintenances,
  updateMaintenance,
} from "./maintenance.service.js";

export const maintenanceRoutes = async (
  app: FastifyInstance,
) => {
  const server =
    app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Maintenance"],
        querystring: maintenanceListQuerySchema,
        response: {
          200: maintenanceListResponseSchema,
          400: maintenanceErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result =
          await getMaintenances(
            request.user.organizationId,
            request.query,
          );

        return reply.send({
          success: true,
          message:
            "Maintenance records fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch maintenance records",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Maintenance"],
        params: maintenanceIdParamSchema,
        response: {
          200: maintenanceSingleResponseSchema,
          404: maintenanceErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const maintenance =
          await getMaintenanceById(
            request.user.organizationId,
            request.params.id,
          );

        return reply.send({
          success: true,
          message:
            "Maintenance record fetched successfully",
          data: maintenance,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Maintenance record not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Maintenance"],
        body: createMaintenanceSchema,
        response: {
          201: maintenanceSingleResponseSchema,
          400: maintenanceErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const maintenance =
          await createMaintenance(
            request.body,
          );

        return reply.status(201).send({
          success: true,
          message:
            "Maintenance record created successfully",
          data: maintenance,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create maintenance record",
        });
      }
    },
  );

  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Maintenance"],
        params: maintenanceIdParamSchema,
        body: updateMaintenanceSchema,
        response: {
          200: maintenanceSingleResponseSchema,
          400: maintenanceErrorResponseSchema,
          404: maintenanceErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const maintenance =
          await updateMaintenance(
            request.user.organizationId,
            request.params.id,
            request.body,
          );

        return reply.send({
          success: true,
          message:
            "Maintenance record updated successfully",
          data: maintenance,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update maintenance record",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Maintenance"],
        params: maintenanceIdParamSchema,
        response: {
          200: maintenanceDeleteResponseSchema,
          400: maintenanceErrorResponseSchema,
          404: maintenanceErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteMaintenance(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message:
            "Maintenance cancelled successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to cancel maintenance",
        });
      }
    },
  );
};