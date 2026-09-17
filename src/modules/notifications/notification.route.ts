import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { authenticate } from "../../middleware/auth.js";

import {
  createNotificationSchema,
  notificationDeleteResponseSchema,
  notificationErrorResponseSchema,
  notificationIdParamSchema,
  notificationListQuerySchema,
  notificationListResponseSchema,
  notificationSingleResponseSchema,
} from "./notification.schema.js";

import {
  createNotification,
  deleteNotification,
  getNotificationById,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "./notification.service.js";

export const notificationRoutes = async (app: FastifyInstance) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Notifications"],
        querystring: notificationListQuerySchema,
        response: {
          200: notificationListResponseSchema,
          400: notificationErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await getNotifications(
          request.user.organizationId,
          request.user.userId,
          request.query,
        );

        return reply.send({
          success: true,
          message: "Notifications fetched successfully",
          ...result,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch notifications",
        });
      }
    },
  );

  server.get(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Notifications"],
        params: notificationIdParamSchema,
        response: {
          200: notificationSingleResponseSchema,
          404: notificationErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const notification = await getNotificationById(
          request.user.organizationId,
          request.user.userId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Notification fetched successfully",
          data: notification,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Notification not found",
        });
      }
    },
  );

  server.post(
    "/",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Notifications"],
        body: createNotificationSchema,
        response: {
          201: notificationSingleResponseSchema,
          400: notificationErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const notification = await createNotification(request.body);

        return reply.status(201).send({
          success: true,
          message: "Notification created successfully",
          data: notification,
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create notification",
        });
      }
    },
  );

  server.patch(
    "/:id/read",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Notifications"],
        params: notificationIdParamSchema,
        response: {
          200: notificationSingleResponseSchema,
          404: notificationErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const notification = await markNotificationAsRead(
          request.user.organizationId,
          request.user.userId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Notification marked as read",
          data: notification,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Notification not found",
        });
      }
    },
  );

  server.patch(
    "/read-all",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Notifications"],
        response: {
          200: notificationDeleteResponseSchema,
          400: notificationErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await markAllNotificationsAsRead(
          request.user.organizationId,
          request.user.userId,
        );

        return reply.send({
          success: true,
          message: "All notifications marked as read",
        });
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to mark notifications as read",
        });
      }
    },
  );

  server.delete(
    "/:id",
    {
      preHandler: authenticate,
      schema: {
        tags: ["Notifications"],
        params: notificationIdParamSchema,
        response: {
          200: notificationDeleteResponseSchema,
          404: notificationErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await deleteNotification(
          request.user.organizationId,
          request.user.userId,
          request.params.id,
        );

        return reply.send({
          success: true,
          message: "Notification deleted successfully",
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          message:
            error instanceof Error ? error.message : "Notification not found",
        });
      }
    },
  );
};
