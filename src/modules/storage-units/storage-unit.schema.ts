import { z } from "zod";

export const storageUnitTypeSchema = z.enum([
  "RACK",
  "SHELF",
  "CABINET",
  "BIN",
  "LOCKER",
  "DRAWER",
  "OTHER",
]);

export const storageUnitStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
]);

export const createStorageUnitSchema = z.object({
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(50),
  type: storageUnitTypeSchema,
  description: z.string().max(500).optional(),
  capacity: z.number().int().min(0).optional(),
  organizationId: z.uuid(),
  storageAreaId: z.uuid(),
  parentId: z.uuid().nullable().optional(),
  status: storageUnitStatusSchema.default("ACTIVE"),
});

export type CreateStorageUnitInput = z.infer<
  typeof createStorageUnitSchema
>;

export const updateStorageUnitSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  code: z.string().min(1).max(50).optional(),
  type: storageUnitTypeSchema.optional(),
  description: z.string().max(500).optional(),
  capacity: z.number().int().min(0).nullable().optional(),
  storageAreaId: z.uuid().optional(),
  parentId: z.uuid().nullable().optional(),
  status: storageUnitStatusSchema.optional(),
});

export type UpdateStorageUnitInput = z.infer<
  typeof updateStorageUnitSchema
>;

export const storageUnitIdParamSchema = z.object({
  id: z.uuid(),
});

export const storageUnitsListQuerySchema = z.object({
  search: z.string().optional(),
  status: storageUnitStatusSchema.optional(),
  type: storageUnitTypeSchema.optional(),
  storageAreaId: z.uuid().optional(),
  parentId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type StorageUnitsListQuery = z.infer<
  typeof storageUnitsListQuerySchema
>;

export const storageUnitResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  storageAreaId: z.uuid(),
  parentId: z.uuid().nullable(),
  name: z.string(),
  code: z.string(),
  type: storageUnitTypeSchema,
  description: z.string().nullable(),
  capacity: z.number().nullable(),
  status: storageUnitStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const storageUnitSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: storageUnitResponseSchema,
});

export const storageUnitsListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(storageUnitResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const storageUnitDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const errorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});