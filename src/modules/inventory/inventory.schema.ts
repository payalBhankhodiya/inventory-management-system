import { z } from "zod";

export const createInventorySchema = z.object({
  organizationId: z.uuid(),
  itemId: z.uuid(),
  storageAreaId: z.uuid(),
  storageUnitId: z.uuid(),

  quantity: z.string().default("0"),
  reservedQuantity: z.string().default("0"),
  availableQuantity: z.string().default("0"),

  minimumStock: z.string().optional(),
  reorderLevel: z.string().optional(),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;

export const updateInventorySchema = z.object({
  quantity: z.string().optional(),
  reservedQuantity: z.string().optional(),
  availableQuantity: z.string().optional(),
  minimumStock: z.string().nullable().optional(),
  reorderLevel: z.string().nullable().optional(),
});

export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;

export const inventoryIdParamSchema = z.object({
  id: z.uuid(),
});

export const inventoriesListQuerySchema = z.object({
  itemId: z.uuid().optional(),
  storageAreaId: z.uuid().optional(),
  storageUnitId: z.uuid().optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type InventoriesListQuery = z.infer<typeof inventoriesListQuerySchema>;

export const inventoryResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  itemId: z.uuid(),
  storageAreaId: z.uuid(),
  storageUnitId: z.uuid(),

  quantity: z.string(),
  reservedQuantity: z.string(),
  availableQuantity: z.string(),

  minimumStock: z.string().nullable(),
  reorderLevel: z.string().nullable(),

  updatedAt: z.date(),
});

export const inventorySingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: inventoryResponseSchema,
});

export const inventoriesListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(inventoryResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const deleteInventoryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const inventoryErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
