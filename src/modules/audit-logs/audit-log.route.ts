import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  auditLogErrorResponseSchema,
  auditLogIdParamSchema,
  auditLogListQuerySchema,
  auditLogListResponseSchema,
  auditLogSingleResponseSchema,
  createAuditLogSchema,
} from "./audit-log.schema.js";

import {
  createAuditLog,
  getAuditLogById,
  getAuditLogs,
} from "./audit-log.service.js";

export const auditLogRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Audit Logs"],
        querystring: auditLogListQuerySchema,
        response: {
          200: auditLogListResponseSchema,
          400: auditLogErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await getAuditLogs(
          request.user.organizationId,
          request.query,
        );

        return reply.send({
          success: true,
          message: "Audit logs fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch audit logs",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Audit Logs"],
        params: auditLogIdParamSchema,
        response: {
          200: auditLogSingleResponseSchema,
          404: auditLogErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const auditLog = await getAuditLogById(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Audit log fetched successfully",
          data: auditLog,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Audit log not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Audit Logs"],
        body: createAuditLogSchema,
        response: {
          201: auditLogSingleResponseSchema,
          400: auditLogErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const auditLog = await createAuditLog(request.body);

        return reply.status(201).send({
          success: true,
          message: "Audit log created successfully",
          data: auditLog,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create audit log",
        });
      }
    },
  );
};
