// import type { FastifyInstance } from "fastify";
// import type { ZodTypeProvider } from "fastify-type-provider-zod";

// import {
//   loginSchema,
//   loginResponseSchema,
//   meResponseSchema,
//   registerSchema,
//   registerResponseSchema,
// } from "./auth.schema.js";

// import { loginUser, registerUser } from "./auth.service.js";

// import { authenticate } from "../../middleware/auth.js";

// export const authRoutes = async (app: FastifyInstance) => {
//   const server = app.withTypeProvider<ZodTypeProvider>();

//   server.post(
//     "/register",
//     {
//       schema: {
//         tags: ["Auth"],
//         body: registerSchema,
//         security: [],
//         response: {
//           201: registerResponseSchema,
//         },
//       },
//     },
//     async (request, reply) => {
//       const user = await registerUser(request.body);

//       return reply.status(201).send({
//         success: true,
//         message: "User registered successfully",
//         data: {
//           id: user.id,
//           name: user.name,
//           email: user.email,
//           organizationId: user.organizationId,
//           roleId: user.roleId,
//           roleName: user.roleName,
//           departmentId: user.departmentId,
//           siteId: user.siteId,
//           status: user.status,
//         },
//       });
//     },
//   );

//   server.post(
//     "/login",
//     {
//       schema: {
//         tags: ["Auth"],
//         body: loginSchema,
//         security: [],
//         response: {
//           200: loginResponseSchema,
//         },
//       },
//     },
//     async (request, reply) => {
//       const user = await loginUser(request.body);

//       const token = await reply.jwtSign({
//         userId: user.id,
//         organizationId: user.organizationId,
//         roleId: user.roleId,
//         roleName: user.roleName,
//       });

//       return reply.send({
//         success: true,
//         message: "Login successful",
//         data: {
//           accessToken: token,
//           user: {
//             id: user.id,
//             name: user.name,
//             email: user.email,
//             organizationId: user.organizationId,
//             roleId: user.roleId,
//             roleName: user.roleName,
//             departmentId: user.departmentId,
//             siteId: user.siteId,
//             status: user.status,
//           },
//         },
//       });
//     },
//   );

//   server.get(
//     "/me",
//     {
//       schema: {
//         tags: ["Auth"],
//         security: [{ bearerAuth: [] }],
//         response: {
//           200: meResponseSchema,
//         },
//       },
//       preHandler: authenticate,
//     },
//     async (request, reply) => {
//       return reply.send({
//         success: true,
//         data: request.user,
//       });
//     },
//   );
// };

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import {
  registerSchema,
  registerResponseSchema,
  errorResponseSchema,
  verifyEmailSchema,
  verifyEmailResponseSchema,
  refreshTokenSchema,
  refreshTokenResponseSchema,
  logoutSchema,
  logoutResponseSchema,
  changePasswordSchema,
  changePasswordResponseSchema,
  forgotPasswordSchema,
  forgotPasswordResponseSchema,
  resetPasswordSchema,
  resetPasswordResponseSchema,
  loginSchema,
  loginResponseSchema,
} from "./auth.schema.js";

import {
  changePassword,
  forgotPassword,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
  verifyEmail,
} from "./auth.service.js";
import { authenticate } from "../../middleware/auth.js";

export const authRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/register",
    {
      schema: {
        tags: ["Auth"],
        security: [],
        body: registerSchema,
        response: {
          201: registerResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const user = await registerUser(request.body, {
          userId: null,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        });

        return reply.status(201).send({
          success: true,
          message: "User registered successfully. Please verify your email.",
          data: user,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to register user",
        });
      }
    },
  );

  server.post(
    "/verify-email",
    {
      schema: {
        tags: ["Auth"],
        security: [],
        body: verifyEmailSchema,
        response: {
          200: verifyEmailResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await verifyEmail(request.body.token);

        return reply.send({
          success: true,
          message: "Email verified successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to verify email",
        });
      }
    },
  );

  server.post(
    "/login",
    {
      schema: {
        tags: ["Auth"],
        security: [],
        body: loginSchema,
        response: {
          200: loginResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await loginUser(request.body, server);

        return reply.send({
          success: true,
          message: "Login successful",
          data: result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : "Failed to login",
        });
      }
    },
  );

  server.post(
    "/refresh-token",
    {
      schema: {
        tags: ["Auth"],
        security: [],
        body: refreshTokenSchema,
        response: {
          200: refreshTokenResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await refreshAccessToken(
          request.body.refreshToken,
          server,
        );

        return reply.send({
          success: true,
          message: "Access token refreshed successfully",
          data: result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to refresh access token",
        });
      }
    },
  );

  server.post(
    "/logout",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Auth"],
        body: logoutSchema,
        response: {
          200: logoutResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await logoutUser(request.body.refreshToken, request.user.userId);

        return reply.send({
          success: true,
          message: "Logout successful",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message: error instanceof Error ? error.message : "Failed to logout",
        });
      }
    },
  );

  server.patch(
    "/change-password",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Auth"],
        body: changePasswordSchema,
        response: {
          200: changePasswordResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await changePassword(request.user.userId, request.body);

        return reply.send({
          success: true,
          message: "Password changed successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to change password",
        });
      }
    },
  );

  server.post(
    "/forgot-password",
    {
      schema: {
        tags: ["Auth"],
        security: [],
        body: forgotPasswordSchema,
        response: {
          200: forgotPasswordResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await forgotPassword(request.body);

        return reply.send({
          success: true,
          message:
            "If an account exists with this email, a password reset link has been sent.",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to process password reset request",
        });
      }
    },
  );

  server.post(
    "/reset-password",
    {
      schema: {
        tags: ["Auth"],
        security: [],
        body: resetPasswordSchema,
        response: {
          200: resetPasswordResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await resetPassword(request.body);

        return reply.send({
          success: true,
          message: "Password reset successfully",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to reset password",
        });
      }
    },
  );
};
