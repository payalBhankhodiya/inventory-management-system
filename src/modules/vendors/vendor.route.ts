import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createVendorSchema,
  deleteVendorResponseSchema,
  vendorErrorResponseSchema,
  vendorIdParamSchema,
  vendorSingleResponseSchema,
  vendorsListQuerySchema,
  vendorsListResponseSchema,
  updateVendorSchema,
} from "./vendor.schema.js";

import {
  createVendor,
  deleteVendor,
  getVendorById,
  getVendors,
  updateVendor,
} from "./vendor.service.js";

export const vendorRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Vendors"],
        querystring: vendorsListQuerySchema,
        response: {
          200: vendorsListResponseSchema,
          400: vendorErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await getVendors(
          request.user.organizationId,
          request.query,
        );

        return reply.send({
          success: true,
          message: "Vendors fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to fetch vendors",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Vendors"],
        params: vendorIdParamSchema,
        response: {
          200: vendorSingleResponseSchema,
          400: vendorErrorResponseSchema,
          404: vendorErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const vendor = await getVendorById(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Vendor fetched successfully",
          data: vendor,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message: error instanceof Error ? error.message : "Vendor not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Vendors"],
        body: createVendorSchema,
        response: {
          201: vendorSingleResponseSchema,
          400: vendorErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const vendor = await createVendor(request.body);

        return reply.status(201).send({
          success: true,
          message: "Vendor created successfully",
          data: vendor,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to create vendor",
        });
      }
    },
  );

  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Vendors"],
        params: vendorIdParamSchema,
        body: updateVendorSchema,
        response: {
          200: vendorSingleResponseSchema,
          400: vendorErrorResponseSchema,
          404: vendorErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const vendor = await updateVendor(
          request.user.organizationId,
          request.params.id,
          request.body,
        );

        return reply.send({
          success: true,
          message: "Vendor updated successfully",
          data: vendor,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to update vendor",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Vendors"],
        params: vendorIdParamSchema,
        response: {
          200: deleteVendorResponseSchema,
          400: vendorErrorResponseSchema,
          404: vendorErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteVendor(request.user.organizationId, request.params.id);

        return reply.send({
          success: true,
          message: "Vendor deactivated successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to deactivate vendor",
        });
      }
    },
  );
};
