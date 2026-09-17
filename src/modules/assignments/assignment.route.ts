import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  assignmentErrorResponseSchema,
  assignmentIdParamSchema,
  assignmentSingleResponseSchema,
  assignmentsListQuerySchema,
  assignmentsListResponseSchema,
  createAssignmentSchema,
  deleteAssignmentResponseSchema,
  updateAssignmentSchema,
} from "./assignment.schema.js";

import {
  createAssignment,
  deleteAssignment,
  getAssignmentById,
  getAssignments,
  updateAssignment,
} from "./assignment.service.js";

export const assignmentRoutes = async (
  app: FastifyInstance,
) => {
  const server =
    app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Assignments"],
        querystring:
          assignmentsListQuerySchema,
        response: {
          200:
            assignmentsListResponseSchema,
          400:
            assignmentErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result =
          await getAssignments(
            request.user.organizationId,
            request.query,
          );

        return reply.send({
          success: true,
          message:
            "Assignments fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch assignments",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Assignments"],
        params:
          assignmentIdParamSchema,
        response: {
          200:
            assignmentSingleResponseSchema,
          400:
            assignmentErrorResponseSchema,
          404:
            assignmentErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const assignment =
          await getAssignmentById(
            request.user.organizationId,
            request.params.id,
          );

        return reply.send({
          success: true,
          message:
            "Assignment fetched successfully",
          data: assignment,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Assignment not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Assignments"],
        body: createAssignmentSchema,
        response: {
          201:
            assignmentSingleResponseSchema,
          400:
            assignmentErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const assignment =
          await createAssignment(
            request.body,
          );

        return reply.status(201).send({
          success: true,
          message:
            "Assignment created successfully",
          data: assignment,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create assignment",
        });
      }
    },
  );

  server.patch(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Assignments"],
        params:
          assignmentIdParamSchema,
        body: updateAssignmentSchema,
        response: {
          200:
            assignmentSingleResponseSchema,
          400:
            assignmentErrorResponseSchema,
          404:
            assignmentErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const assignment =
          await updateAssignment(
            request.user.organizationId,
            request.params.id,
            request.body,
          );

        return reply.send({
          success: true,
          message:
            "Assignment updated successfully",
          data: assignment,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update assignment",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Assignments"],
        params:
          assignmentIdParamSchema,
        response: {
          200:
            deleteAssignmentResponseSchema,
          400:
            assignmentErrorResponseSchema,
          404:
            assignmentErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteAssignment(
          request.user.organizationId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message:
            "Assignment cancelled successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to cancel assignment",
        });
      }
    },
  );
};