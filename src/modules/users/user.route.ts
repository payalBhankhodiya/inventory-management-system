import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createUserSchema,
  deleteUserResponseSchema,
  updateUserSchema,
  userIdParamSchema,
  userSingleResponseSchema,
  usersListQuerySchema,
  usersListResponseSchema,
} from "./user.schema.js";

import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "./user.service.js";

export const userRoutes = async (
  app: FastifyInstance,
) => {
  const server =
    app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Users"],

        querystring: usersListQuerySchema,

        response: {
          200: usersListResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await getUsers(
        request.user.organizationId,
        request.query,
      );

      return reply.send({
        success: true,
        message: "Users retrieved successfully",
        ...result,
      });
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Users"],

        params: userIdParamSchema,

        response: {
          200: userSingleResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = await getUserById(
        request.user.organizationId,
        request.params.id,
      );

      return reply.send({
        success: true,
        message: "User retrieved successfully",
        data: user,
      });
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Users"],

        body: createUserSchema,

        response: {
          201: userSingleResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = await createUser(
        request.body,
      );

      return reply.status(201).send({
        success: true,
        message: "User created successfully",
        data: user,
      });
    },
  );

  server.patch(
    "/:id",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Users"],

        params: userIdParamSchema,

        body: updateUserSchema,

        response: {
          200: userSingleResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = await updateUser(
        request.user.organizationId,
        request.params.id,
        request.body,
      );

      return reply.send({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,

      schema: {
        tags: ["Users"],

        params: userIdParamSchema,

        response: {
          200: deleteUserResponseSchema,
        },
      },
    },
    async (request, reply) => {
      await deleteUser(
        request.user.organizationId,
        request.params.id,
      );

      return reply.send({
        success: true,
        message: "User deactivated successfully",
      });
    },
  );
};