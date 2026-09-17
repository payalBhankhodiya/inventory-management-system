import { z } from "zod";

export const itemCategoryStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
]);

export const createItemCategorySchema = z.object({
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  organizationId: z.uuid(),
  parentId: z.uuid().nullable().optional(),
  status: itemCategoryStatusSchema.default("ACTIVE"),
});

export type CreateItemCategoryInput = z.infer<
  typeof createItemCategorySchema
>;

export const updateItemCategorySchema = z.object({
  name: z.string().min(1).max(150).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  parentId: z.uuid().nullable().optional(),
  status: itemCategoryStatusSchema.optional(),
});

export type UpdateItemCategoryInput = z.infer<
  typeof updateItemCategorySchema
>;

export const itemCategoryIdParamSchema = z.object({
  id: z.uuid(),
});

export const itemCategoriesListQuerySchema = z.object({
  search: z.string().optional(),
  status: itemCategoryStatusSchema.optional(),
  parentId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type ItemCategoriesListQuery = z.infer<
  typeof itemCategoriesListQuerySchema
>;

export const itemCategoryResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  parentId: z.uuid().nullable(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  status: itemCategoryStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const itemCategorySingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: itemCategoryResponseSchema,
});

export const itemCategoriesListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(itemCategoryResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const itemCategoryDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const errorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});