import { z } from "zod";

export const createAuditLogSchema = z.object({
  organizationId: z.uuid(),

  userId: z.uuid().optional(),

  action: z.string().min(1).max(100),

  entityType: z.string().min(1).max(100),

  entityId: z.uuid().optional(),

  oldValue: z.record(z.string(), z.unknown()).nullable().optional(),

  newValue: z.record(z.string(), z.unknown()).nullable().optional(),

  ipAddress: z.string().optional(),

  userAgent: z.string().max(1000).optional(),
});

export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>;

export const auditLogIdParamSchema = z.object({
  id: z.uuid(),
});

export const auditLogListQuerySchema = z.object({
  search: z.string().optional(),

  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.uuid().optional(),
  userId: z.uuid().optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type AuditLogListQuery = z.infer<typeof auditLogListQuerySchema>;

export const auditLogResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),

  userId: z.uuid().nullable(),

  action: z.string(),
  entityType: z.string(),
  entityId: z.uuid().nullable(),

  oldValue: z.unknown().nullable(),
  newValue: z.unknown().nullable(),

  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),

  createdAt: z.date(),
});

export const auditLogSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: auditLogResponseSchema,
});

export const auditLogListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(auditLogResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const auditLogErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
