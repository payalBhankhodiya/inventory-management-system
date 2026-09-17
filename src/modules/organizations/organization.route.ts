import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createOrganizationSchema,
  organizationDeleteResponseSchema,
  organizationErrorResponseSchema,
  organizationIdParamSchema,
  organizationListQuerySchema,
  organizationListResponseSchema,
  organizationSingleResponseSchema,
  updateOrganizationSchema,
} from "./organization.schema.js";

import {
  createOrganization,
  deleteOrganization,
  getOrganizationById,
  getOrganizations,
  updateOrganization,
} from "./organization.service.js";

export const organizationRoutes = async (
  app: FastifyInstance,
) => {
  const server =
    app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Organizations"],
        querystring:
          organizationListQuerySchema,
        response: {
          200:
            organizationListResponseSchema,
          400:
            organizationErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result =
          await getOrganizations(
            request.query,
          );

        return reply.send({
          success: true,
          message:
            "Organizations fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch organizations",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Organizations"],
        params:
          organizationIdParamSchema,
        response: {
          200:
            organizationSingleResponseSchema,
          404:
            organizationErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const organization =
          await getOrganizationById(
            request.params.id,
          );

        return reply.send({
          success: true,
          message:
            "Organization fetched successfully",
          data: organization,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Organization not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Organizations"],
        body: createOrganizationSchema,
        response: {
          201:
            organizationSingleResponseSchema,
          400:
            organizationErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const organization =
          await createOrganization(
            request.body,
          );

        return reply.status(201).send({
          success: true,
          message:
            "Organization created successfully",
          data: organization,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create organization",
        });
      }
    },
  );

  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Organizations"],
        params:
          organizationIdParamSchema,
        body: updateOrganizationSchema,
        response: {
          200:
            organizationSingleResponseSchema,
          400:
            organizationErrorResponseSchema,
          404:
            organizationErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const organization =
          await updateOrganization(
            request.params.id,
            request.body,
          );

        return reply.send({
          success: true,
          message:
            "Organization updated successfully",
          data: organization,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update organization",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Organizations"],
        params:
          organizationIdParamSchema,
        response: {
          200:
            organizationDeleteResponseSchema,
          400:
            organizationErrorResponseSchema,
          404:
            organizationErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteOrganization(
          request.params.id,
        );

        return reply.send({
          success: true,
          message:
            "Organization deactivated successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to deactivate organization",
        });
      }
    },
  );
};
