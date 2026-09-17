import { z } from "zod";

export const assetConditionSchema = z.enum(["NEW", "GOOD", "FAIR", "DAMAGED"]);

export const assetStatusSchema = z.enum([
  "AVAILABLE",
  "ASSIGNED",
  "IN_TRANSIT",
  "UNDER_MAINTENANCE",
  "DAMAGED",
  "LOST",
  "DISPOSED",
]);

export const createAssetSchema = z.object({
  organizationId: z.uuid(),
  itemId: z.uuid(),

  assetTag: z.string().min(1).max(100),
  serialNumber: z.string().max(150).optional(),
  barcode: z.string().max(150).optional(),

  vendorId: z.uuid().optional(),

  purchaseDate: z.iso.date().optional(),
  purchasePrice: z.string().optional(),

  warrantyStartDate: z.iso.date().optional(),
  warrantyEndDate: z.iso.date().optional(),

  condition: assetConditionSchema.default("NEW"),
  status: assetStatusSchema.default("AVAILABLE"),

  siteId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  storageAreaId: z.uuid().optional(),
  storageUnitId: z.uuid().optional(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;

export const updateAssetSchema = z.object({
  itemId: z.uuid().optional(),

  assetTag: z.string().min(1).max(100).optional(),
  serialNumber: z.string().max(150).nullable().optional(),
  barcode: z.string().max(150).nullable().optional(),

  vendorId: z.uuid().nullable().optional(),

  purchaseDate: z.iso.date().nullable().optional(),
  purchasePrice: z.string().nullable().optional(),

  warrantyStartDate: z.iso.date().nullable().optional(),
  warrantyEndDate: z.iso.date().nullable().optional(),

  condition: assetConditionSchema.optional(),
  status: assetStatusSchema.optional(),

  siteId: z.uuid().nullable().optional(),
  departmentId: z.uuid().nullable().optional(),
  storageAreaId: z.uuid().nullable().optional(),
  storageUnitId: z.uuid().nullable().optional(),
});

export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;

export const assetIdParamSchema = z.object({
  id: z.uuid(),
});

export const assetsListQuerySchema = z.object({
  search: z.string().optional(),
  condition: assetConditionSchema.optional(),
  status: assetStatusSchema.optional(),
  itemId: z.uuid().optional(),
  vendorId: z.uuid().optional(),
  siteId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  storageAreaId: z.uuid().optional(),
  storageUnitId: z.uuid().optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type AssetsListQuery = z.infer<typeof assetsListQuerySchema>;

export const assetResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  itemId: z.uuid(),

  assetTag: z.string(),
  serialNumber: z.string().nullable(),
  barcode: z.string().nullable(),

  vendorId: z.uuid().nullable(),

  purchaseDate: z.string().nullable(),
  purchasePrice: z.string().nullable(),

  warrantyStartDate: z.string().nullable(),
  warrantyEndDate: z.string().nullable(),

  condition: assetConditionSchema,
  status: assetStatusSchema,

  siteId: z.uuid().nullable(),
  departmentId: z.uuid().nullable(),
  storageAreaId: z.uuid().nullable(),
  storageUnitId: z.uuid().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export const assetSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: assetResponseSchema,
});

export const assetsListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(assetResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const deleteAssetResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const assetErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
