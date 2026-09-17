import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import {
  loginSchema,
  loginResponseSchema,
  meResponseSchema,
  registerSchema,
  registerResponseSchema,
} from "./auth.schema.js";

import { loginUser, registerUser } from "./auth.service.js";

import { authenticate } from "../../middleware/auth.js";

export const authRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/register",
    {
      schema: {
        tags: ["Auth"],
        body: registerSchema,
        security: [],
        response: {
          201: registerResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = await registerUser(request.body);

      return reply.status(201).send({
        success: true,
        message: "User registered successfully",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          organizationId: user.organizationId,
          roleId: user.roleId,
          roleName: user.roleName,
          departmentId: user.departmentId,
          siteId: user.siteId,
          status: user.status,
        },
      });
    },
  );

  server.post(
    "/login",
    {
      schema: {
        tags: ["Auth"],
        body: loginSchema,
        security: [],
        response: {
          200: loginResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = await loginUser(request.body);

      const token = await reply.jwtSign({
        userId: user.id,
        organizationId: user.organizationId,
        roleId: user.roleId,
        roleName: user.roleName,
      });

      return reply.send({
        success: true,
        message: "Login successful",
        data: {
          accessToken: token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            organizationId: user.organizationId,
            roleId: user.roleId,
            roleName: user.roleName,
            departmentId: user.departmentId,
            siteId: user.siteId,
            status: user.status,
          },
        },
      });
    },
  );

  server.get(
    "/me",
    {
      schema: {
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        response: {
          200: meResponseSchema,
        },
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      return reply.send({
        success: true,
        data: request.user,
      });
    },
  );
};
