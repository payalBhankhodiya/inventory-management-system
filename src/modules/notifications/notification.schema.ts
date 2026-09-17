import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "LOW_STOCK",
  "TRANSFER_REQUESTED",
  "TRANSFER_APPROVED",
  "TRANSFER_COMPLETED",
  "ASSET_ASSIGNED",
  "ASSET_RETURNED",
  "MAINTENANCE",
  "SYSTEM",
]);

export const createNotificationSchema = z.object({
  organizationId: z.uuid(),
  userId: z.uuid(),

  type: notificationTypeSchema,

  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),

  entityType: z.string().max(100).optional(),
  entityId: z.uuid().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const notificationIdParamSchema = z.object({
  id: z.uuid(),
});

export const notificationListQuerySchema = z.object({
  type: notificationTypeSchema.optional(),

  entityType: z.string().optional(),
  entityId: z.uuid().optional(),

  isRead: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

export const notificationResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  userId: z.uuid(),

  type: notificationTypeSchema,

  title: z.string(),
  message: z.string(),

  entityType: z.string().nullable(),
  entityId: z.uuid().nullable(),

  isRead: z.boolean(),

  createdAt: z.date(),
  readAt: z.date().nullable(),
});

export const notificationSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: notificationResponseSchema,
});

export const notificationListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(notificationResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const notificationDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const notificationErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
