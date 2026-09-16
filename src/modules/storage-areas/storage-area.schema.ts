import { z } from "zod";

export const storageAreaStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const createStorageAreaSchema = z.object({
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  organizationId: z.uuid(),
  siteId: z.uuid(),
  departmentId: z.uuid(),
  status: storageAreaStatusSchema.default("ACTIVE"),
});

export type CreateStorageAreaInput = z.infer<typeof createStorageAreaSchema>;

export const updateStorageAreaSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  siteId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  status: storageAreaStatusSchema.optional(),
});

export type UpdateStorageAreaInput = z.infer<typeof updateStorageAreaSchema>;

export const storageAreaIdParamSchema = z.object({
  id: z.uuid(),
});

export const storageAreasListQuerySchema = z.object({
  search: z.string().optional(),
  status: storageAreaStatusSchema.optional(),
  siteId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type StorageAreasListQuery = z.infer<typeof storageAreasListQuerySchema>;

export const storageAreaResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  siteId: z.uuid(),
  departmentId: z.uuid(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  status: storageAreaStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const storageAreaSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: storageAreaResponseSchema,
});

export const storageAreasListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(storageAreaResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const storageAreaDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const errorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
