import { z } from "zod";

export const unitOfMeasureStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
]);

export const createUnitOfMeasureSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  description: z.string().max(500).optional(),
  organizationId: z.uuid(),
  status: unitOfMeasureStatusSchema.default("ACTIVE"),
});

export type CreateUnitOfMeasureInput = z.infer<
  typeof createUnitOfMeasureSchema
>;

export const updateUnitOfMeasureSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(20).optional(),
  description: z.string().max(500).optional(),
  status: unitOfMeasureStatusSchema.optional(),
});

export type UpdateUnitOfMeasureInput = z.infer<
  typeof updateUnitOfMeasureSchema
>;

export const unitOfMeasureIdParamSchema = z.object({
  id: z.uuid(),
});

export const unitsOfMeasureListQuerySchema = z.object({
  search: z.string().optional(),
  status: unitOfMeasureStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type UnitsOfMeasureListQuery = z.infer<
  typeof unitsOfMeasureListQuerySchema
>;

export const unitOfMeasureResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  status: unitOfMeasureStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const unitOfMeasureSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: unitOfMeasureResponseSchema,
});

export const unitsOfMeasureListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(unitOfMeasureResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const unitOfMeasureDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const errorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});