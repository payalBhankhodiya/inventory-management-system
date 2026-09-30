import { z } from "zod";

export const transferStatusSchema = z.enum([
  "DRAFT",
  "REQUESTED",
  "APPROVED",
  "IN_TRANSIT",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
]);

export const transferItemInputSchema = z.object({
  itemId: z.uuid(),
  assetId: z.uuid().nullable().optional(),
  quantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Quantity must be a valid decimal")
    .refine((value) => Number(value) > 0, "Quantity must be greater than 0"),
  remarks: z.string().max(1000).optional(),
});

export type TransferItemInput = z.infer<typeof transferItemInputSchema>;

export const createTransferSchema = z
  .object({
    organizationId: z.uuid(),
    referenceNo: z.string().min(1).max(100),

    fromStorageAreaId: z.uuid(),
    fromStorageUnitId: z.uuid(),
    toStorageAreaId: z.uuid(),
    toStorageUnitId: z.uuid(),

    transferDate: z.iso.datetime().optional(),
    reason: z.string().max(500).optional(),
    remarks: z.string().max(1000).optional(),

    items: z.array(transferItemInputSchema).min(1),
  })
  .refine(
    (data) =>
      data.fromStorageAreaId !== data.toStorageAreaId ||
      data.fromStorageUnitId !== data.toStorageUnitId,
    {
      message: "Source and destination must be different",
      path: ["toStorageUnitId"],
    },
  );

export type CreateTransferInput = z.infer<typeof createTransferSchema>;

export const updateTransferSchema = z.object({
  fromStorageAreaId: z.uuid().optional(),
  fromStorageUnitId: z.uuid().optional(),

  toStorageAreaId: z.uuid().optional(),
  toStorageUnitId: z.uuid().optional(),

  transferDate: z.iso.datetime().nullable().optional(),
  reason: z.string().max(500).nullable().optional(),
  remarks: z.string().max(1000).nullable().optional(),
});

export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;

export const transferIdParamSchema = z.object({
  id: z.uuid(),
});

export const transfersListQuerySchema = z.object({
  search: z.string().optional(),
  status: transferStatusSchema.optional(),
  requestedBy: z.uuid().optional(),
  approvedBy: z.uuid().optional(),

  fromStorageAreaId: z.uuid().optional(),
  fromStorageUnitId: z.uuid().optional(),

  toStorageAreaId: z.uuid().optional(),
  toStorageUnitId: z.uuid().optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type TransfersListQuery = z.infer<typeof transfersListQuerySchema>;

export const transferItemResponseSchema = z.object({
  id: z.uuid(),
  transferId: z.uuid(),
  itemId: z.uuid(),
  assetId: z.uuid().nullable(),
  quantity: z.string(),
  remarks: z.string().nullable(),
  createdAt: z.date(),
});

export const transferResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),

  referenceNo: z.string(),

  fromStorageAreaId: z.uuid(),
  fromStorageUnitId: z.uuid(),

  toStorageAreaId: z.uuid(),
  toStorageUnitId: z.uuid(),

  requestedBy: z.uuid(),
  approvedBy: z.uuid().nullable(),

  transferDate: z.date().nullable(),

  status: transferStatusSchema,

  reason: z.string().nullable(),
  remarks: z.string().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),

  items: z.array(transferItemResponseSchema),
});

export const transferSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: transferResponseSchema,
});

export const transfersListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(transferResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const deleteTransferResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const transferErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
