import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createSiteSchema,
  siteDeleteResponseSchema,
  siteIdParamSchema,
  siteSingleResponseSchema,
  sitesListQuerySchema,
  sitesListResponseSchema,
  updateSiteSchema,
} from "./site.schema.js";

import {
  createSite,
  deleteSite,
  getSiteById,
  getSites,
  updateSite,
} from "./site.service.js";

export const siteRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Get Sites
  server.get(
    "/",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Sites"],

        querystring: sitesListQuerySchema,

        response: {
          200: sitesListResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await getSites(request.user.organizationId, request.query);

      return reply.send({
        success: true,
        message: "Sites retrieved successfully",
        ...result,
      });
    },
  );

  // Get Site
  server.get(
    "/:id",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Sites"],

        params: siteIdParamSchema,

        response: {
          200: siteSingleResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const site = await getSiteById(
        request.user.organizationId,
        request.params.id,
      );

      return reply.send({
        success: true,
        message: "Site retrieved successfully",
        data: site,
      });
    },
  );

  // Create Site
  server.post(
    "/",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Sites"],

        body: createSiteSchema,

        response: {
          201: siteSingleResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const site = await createSite(request.body, {
        userId: request.user.userId,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"] ?? null,
      });
      return reply.status(201).send({
        success: true,
        message: "Site created successfully",
        data: site,
      });
    },
  );

  // Update Site
  server.patch(
    "/:id",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Sites"],

        params: siteIdParamSchema,

        body: updateSiteSchema,

        response: {
          200: siteSingleResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const site = await updateSite(
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
        message: "Site updated successfully",
        data: site,
      });
    },
  );

  // Deactivate Site
  server.delete(
    "/:id",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Sites"],

        params: siteIdParamSchema,

        response: {
          200: siteDeleteResponseSchema,
        },
      },
    },
    async (request, reply) => {
      await deleteSite(request.user.organizationId, request.params.id, {
        userId: request.user.userId,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"] ?? null,
      });
      return reply.send({
        success: true,
        message: "Site deactivated successfully",
      });
    },
  );
};
