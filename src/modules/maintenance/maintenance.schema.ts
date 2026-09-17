import { z } from "zod";

export const maintenancePrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const maintenanceStatusSchema = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_PARTS",
  "COMPLETED",
  "CANCELLED",
]);

export const createMaintenanceSchema = z.object({
  organizationId: z.uuid(),
  assetId: z.uuid(),
  reportedBy: z.uuid(),
  vendorId: z.uuid().optional(),

  issue: z.string().min(1).max(300),
  description: z.string().max(1000).optional(),

  priority: maintenancePrioritySchema.default("MEDIUM"),

  startDate: z.iso.datetime().optional(),
  expectedCompletionDate: z.iso.datetime().optional(),
  completedDate: z.iso.datetime().optional(),

  cost: z.string().optional(),

  resolution: z.string().max(1000).optional(),

  status: maintenanceStatusSchema.default("OPEN"),

  remarks: z.string().max(1000).optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;

export const updateMaintenanceSchema = z.object({
  vendorId: z.uuid().nullable().optional(),

  issue: z.string().min(1).max(300).optional(),
  description: z.string().max(1000).nullable().optional(),

  priority: maintenancePrioritySchema.optional(),

  startDate: z.iso.datetime().nullable().optional(),
  expectedCompletionDate: z.iso.datetime().nullable().optional(),
  completedDate: z.iso.datetime().nullable().optional(),

  cost: z.string().nullable().optional(),

  resolution: z.string().max(1000).nullable().optional(),

  status: maintenanceStatusSchema.optional(),

  remarks: z.string().max(1000).nullable().optional(),
});

export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;

export const maintenanceIdParamSchema = z.object({
  id: z.uuid(),
});

export const maintenanceListQuerySchema = z.object({
  search: z.string().optional(),

  status: maintenanceStatusSchema.optional(),
  priority: maintenancePrioritySchema.optional(),

  assetId: z.uuid().optional(),
  reportedBy: z.uuid().optional(),
  vendorId: z.uuid().optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type MaintenanceListQuery = z.infer<typeof maintenanceListQuerySchema>;

export const maintenanceResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),

  assetId: z.uuid(),
  reportedBy: z.uuid(),
  vendorId: z.uuid().nullable(),

  issue: z.string(),
  description: z.string().nullable(),

  priority: maintenancePrioritySchema,

  startDate: z.date().nullable(),
  expectedCompletionDate: z.date().nullable(),
  completedDate: z.date().nullable(),

  cost: z.string().nullable(),

  resolution: z.string().nullable(),

  status: maintenanceStatusSchema,

  remarks: z.string().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export const maintenanceSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: maintenanceResponseSchema,
});

export const maintenanceListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(maintenanceResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const maintenanceDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const maintenanceErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
