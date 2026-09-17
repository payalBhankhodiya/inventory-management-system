import { z } from "zod";

export const returnStatusSchema = z.enum([
  "RECEIVED",
  "INSPECTED",
  "COMPLETED",
  "REJECTED",
]);

export const returnConditionSchema = z.enum([
  "NEW",
  "GOOD",
  "FAIR",
  "DAMAGED",
]);

export const createReturnSchema = z.object({
  organizationId: z.uuid(),

  assignmentId: z.uuid(),
  assetId: z.uuid(),

  returnedByUserId: z.uuid(),
  receivedByUserId: z.uuid(),

  returnSiteId: z.uuid(),
  returnDepartmentId: z.uuid().optional(),
  returnStorageAreaId: z.uuid().optional(),
  returnStorageUnitId: z.uuid().optional(),

  returnDate: z.iso.datetime(),

  condition: z.string().min(1).max(30),
  damageDescription: z.string().max(1000).optional(),
  remarks: z.string().max(1000).optional(),

  status: returnStatusSchema.default("RECEIVED"),
});

export type CreateReturnInput = z.infer<
  typeof createReturnSchema
>;

export const updateReturnSchema = z.object({
  receivedByUserId: z.uuid().optional(),

  returnSiteId: z.uuid().optional(),
  returnDepartmentId: z.uuid().nullable().optional(),
  returnStorageAreaId: z.uuid().nullable().optional(),
  returnStorageUnitId: z.uuid().nullable().optional(),

  returnDate: z.iso.datetime().optional(),

  condition: z.string().min(1).max(30).optional(),
  damageDescription: z.string().max(1000).nullable().optional(),
  remarks: z.string().max(1000).nullable().optional(),

  status: returnStatusSchema.optional(),
});

export type UpdateReturnInput = z.infer<
  typeof updateReturnSchema
>;

export const returnIdParamSchema = z.object({
  id: z.uuid(),
});

export const returnsListQuerySchema = z.object({
  search: z.string().optional(),

  status: returnStatusSchema.optional(),
  condition: z.string().optional(),

  assignmentId: z.uuid().optional(),
  assetId: z.uuid().optional(),

  returnedByUserId: z.uuid().optional(),
  receivedByUserId: z.uuid().optional(),

  returnSiteId: z.uuid().optional(),
  returnDepartmentId: z.uuid().optional(),
  returnStorageAreaId: z.uuid().optional(),
  returnStorageUnitId: z.uuid().optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type ReturnsListQuery = z.infer<
  typeof returnsListQuerySchema
>;

export const returnResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),

  assignmentId: z.uuid(),
  assetId: z.uuid(),

  returnedByUserId: z.uuid(),
  receivedByUserId: z.uuid(),

  returnSiteId: z.uuid(),
  returnDepartmentId: z.uuid().nullable(),
  returnStorageAreaId: z.uuid().nullable(),
  returnStorageUnitId: z.uuid().nullable(),

  returnDate: z.date(),

  condition: z.string(),
  damageDescription: z.string().nullable(),
  remarks: z.string().nullable(),

  status: returnStatusSchema,

  createdAt: z.date(),
  updatedAt: z.date(),
});

export const returnSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: returnResponseSchema,
});

export const returnsListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(returnResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const deleteReturnResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const returnErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});