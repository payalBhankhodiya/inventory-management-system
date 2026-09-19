import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";
import {
  createDepartment,
  deleteDepartment,
  getDepartmentById,
  getDepartments,
  updateDepartment,
} from "./department.service.js";

import {
  createDepartmentSchema,
  departmentDeleteResponseSchema,
  departmentIdParamSchema,
  departmentSingleResponseSchema,
  departmentsListQuerySchema,
  departmentsListResponseSchema,
  errorResponseSchema,
  updateDepartmentSchema,
} from "./department.schema.js";

export const departmentRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Get all departments
  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Departments"],
        querystring: departmentsListQuerySchema,
        response: {
          200: departmentsListResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await getDepartments(
          request.user.organizationId,
          request.query,
        );

        return reply.send({
          success: true,
          message: "Departments fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch departments",
        });
      }
    },
  );

  // Get department by ID
  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Departments"],
        params: departmentIdParamSchema,
        response: {
          200: departmentSingleResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const department = await getDepartmentById(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Department fetched successfully",
          data: department,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Department not found",
        });
      }
    },
  );

  // Create department
  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Departments"],
        body: createDepartmentSchema,
        response: {
          201: departmentSingleResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const department = await createDepartment(request.body, {
          userId: request.user.userId,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        });
        return reply.status(201).send({
          success: true,
          message: "Department created successfully",
          data: department,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create department",
        });
      }
    },
  );

  // Update department
  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Departments"],
        params: departmentIdParamSchema,
        body: updateDepartmentSchema,
        response: {
          200: departmentSingleResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const department = await updateDepartment(
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
          message: "Department updated successfully",
          data: department,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update department",
        });
      }
    },
  );

  // Deactivate department
  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Departments"],
        params: departmentIdParamSchema,
        response: {
          200: departmentDeleteResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteDepartment(request.user.organizationId, request.params.id, {
          userId: request.user.userId,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        });
        return reply.send({
          success: true,
          message: "Department deactivated successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to deactivate department",
        });
      }
    },
  );
};
