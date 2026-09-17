import { z } from "zod";

export const itemTypeSchema = z.enum(["CONSUMABLE", "ASSET"]);
export const itemStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const createItemSchema = z.object({
  organizationId: z.uuid(),
  categoryId: z.uuid(),
  unitOfMeasureId: z.uuid(),

  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50),
  sku: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),

  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),

  itemType: itemTypeSchema,
  isTrackable: z.boolean().default(false),
  isSerialized: z.boolean().default(false),
  isBatchTracked: z.boolean().default(false),

  minimumStock: z.string().optional(),
  maximumStock: z.string().optional(),
  reorderLevel: z.string().optional(),

  status: itemStatusSchema.default("ACTIVE"),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = z.object({
  categoryId: z.uuid().optional(),
  unitOfMeasureId: z.uuid().optional(),

  name: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(50).optional(),
  sku: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),

  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),

  itemType: itemTypeSchema.optional(),
  isTrackable: z.boolean().optional(),
  isSerialized: z.boolean().optional(),
  isBatchTracked: z.boolean().optional(),

  minimumStock: z.string().optional(),
  maximumStock: z.string().optional(),
  reorderLevel: z.string().optional(),

  status: itemStatusSchema.optional(),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export const itemIdParamSchema = z.object({
  id: z.uuid(),
});

export const itemsListQuerySchema = z.object({
  search: z.string().optional(),
  status: itemStatusSchema.optional(),
  itemType: itemTypeSchema.optional(),
  categoryId: z.uuid().optional(),
  unitOfMeasureId: z.uuid().optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type ItemsListQuery = z.infer<typeof itemsListQuerySchema>;

export const itemResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  categoryId: z.uuid(),
  unitOfMeasureId: z.uuid(),

  name: z.string(),
  code: z.string(),
  sku: z.string(),
  description: z.string().nullable(),

  brand: z.string().nullable(),
  model: z.string().nullable(),

  itemType: itemTypeSchema,
  isTrackable: z.boolean(),
  isSerialized: z.boolean(),
  isBatchTracked: z.boolean(),

  minimumStock: z.string().nullable(),
  maximumStock: z.string().nullable(),
  reorderLevel: z.string().nullable(),

  status: itemStatusSchema,

  createdAt: z.date(),
  updatedAt: z.date(),
});

export const itemSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: itemResponseSchema,
});

export const itemsListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(itemResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const deleteItemResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const itemErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
