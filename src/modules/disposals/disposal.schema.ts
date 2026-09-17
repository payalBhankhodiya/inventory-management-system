import { z } from "zod";

export const disposalMethodSchema = z.enum([
  "SCRAP",
  "RECYCLE",
  "SELL",
  "DONATE",
  "DESTROY",
  "OTHER",
]);

export const createDisposalSchema = z.object({
  organizationId: z.uuid(),
  assetId: z.uuid(),

  reason: z.string().min(1).max(500),

  disposalDate: z.iso.datetime(),

  disposalMethod: disposalMethodSchema,

  approvedBy: z.uuid(),
  disposedBy: z.uuid(),

  residualValue: z.string().optional(),

  remarks: z.string().max(1000).optional(),
});

export type CreateDisposalInput = z.infer<
  typeof createDisposalSchema
>;

export const updateDisposalSchema = z.object({
  reason: z.string().min(1).max(500).optional(),

  disposalDate: z.iso.datetime().optional(),

  disposalMethod: disposalMethodSchema.optional(),

  approvedBy: z.uuid().optional(),
  disposedBy: z.uuid().optional(),

  residualValue: z.string().nullable().optional(),

  remarks: z.string().max(1000).nullable().optional(),
});

export type UpdateDisposalInput = z.infer<
  typeof updateDisposalSchema
>;

export const disposalIdParamSchema = z.object({
  id: z.uuid(),
});

export const disposalListQuerySchema = z.object({
  search: z.string().optional(),

  disposalMethod: disposalMethodSchema.optional(),

  assetId: z.uuid().optional(),
  approvedBy: z.uuid().optional(),
  disposedBy: z.uuid().optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type DisposalListQuery = z.infer<
  typeof disposalListQuerySchema
>;

export const disposalResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),

  assetId: z.uuid(),

  reason: z.string(),

  disposalDate: z.date(),

  disposalMethod: disposalMethodSchema,

  approvedBy: z.uuid(),
  disposedBy: z.uuid(),

  residualValue: z.string().nullable(),

  remarks: z.string().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export const disposalSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: disposalResponseSchema,
});

export const disposalListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(disposalResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const disposalDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const disposalErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});