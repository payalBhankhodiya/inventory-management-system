import { z } from "zod";

export const stockTransactionTypeSchema = z.enum([
  "RECEIPT",
  "ISSUE",
  "TRANSFER",
  "RETURN",
  "ADJUSTMENT",
  "DISPOSAL",
]);

export const stockTransactionItemInputSchema = z.object({
  itemId: z.uuid(),

  fromStorageAreaId: z.uuid().nullable().optional(),
  fromStorageUnitId: z.uuid().nullable().optional(),

  toStorageAreaId: z.uuid().nullable().optional(),
  toStorageUnitId: z.uuid().nullable().optional(),

  quantity: z.string().min(1),
  unitCost: z.string().optional(),

  remarks: z.string().max(1000).optional(),
});

export type StockTransactionItemInput = z.infer<
  typeof stockTransactionItemInputSchema
>;

export const createStockTransactionSchema = z.object({
  organizationId: z.uuid(),

  transactionNo: z.string().min(1).max(100),
  type: stockTransactionTypeSchema,

  referenceType: z.string().nullable().optional(),
  referenceId: z.uuid().nullable().optional(),

  reason: z.string().max(500).optional(),
  remarks: z.string().max(1000).optional(),

  performedBy: z.uuid(),

  items: z.array(stockTransactionItemInputSchema).min(1),
});

export type CreateStockTransactionInput = z.infer<
  typeof createStockTransactionSchema
>;

export const stockTransactionIdParamSchema = z.object({
  id: z.uuid(),
});

export const stockTransactionItemResponseSchema = z.object({
  id: z.uuid(),
  stockTransactionId: z.uuid(),
  itemId: z.uuid(),

  fromStorageAreaId: z.uuid().nullable(),
  fromStorageUnitId: z.uuid().nullable(),

  toStorageAreaId: z.uuid().nullable(),
  toStorageUnitId: z.uuid().nullable(),

  quantity: z.string(),
  unitCost: z.string().nullable(),

  remarks: z.string().nullable(),
  createdAt: z.date(),
});

export const stockTransactionResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),

  transactionNo: z.string(),
  type: stockTransactionTypeSchema,

  referenceType: z.string().nullable(),
  referenceId: z.uuid().nullable(),

  reason: z.string().nullable(),
  remarks: z.string().nullable(),

  performedBy: z.uuid(),
  createdAt: z.date(),

  items: z.array(stockTransactionItemResponseSchema),
});

export const stockTransactionSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: stockTransactionResponseSchema,
});

export const stockTransactionsListQuerySchema = z.object({
  search: z.string().optional(),
  type: stockTransactionTypeSchema.optional(),
  performedBy: z.uuid().optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type StockTransactionsListQuery = z.infer<
  typeof stockTransactionsListQuerySchema
>;

export const stockTransactionsListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(stockTransactionResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const updateStockTransactionSchema = z.object({
  transactionNo: z.string().min(1).max(100),

  type: stockTransactionTypeSchema,

  referenceType: z.string().nullable().optional(),

  referenceId: z.uuid().nullable().optional(),

  reason: z.string().max(500).nullable().optional(),

  remarks: z.string().max(1000).nullable().optional(),

  performedBy: z.uuid(),

  items: z
    .array(
      z.object({
        itemId: z.uuid(),

        fromStorageAreaId: z
          .uuid()
          .nullable()
          .optional(),

        fromStorageUnitId: z
          .uuid()
          .nullable()
          .optional(),

        toStorageAreaId: z
          .uuid()
          .nullable()
          .optional(),

        toStorageUnitId: z
          .uuid()
          .nullable()
          .optional(),

        quantity: z.string().min(1),

        unitCost: z
          .string()
          .nullable()
          .optional(),

        remarks: z
          .string()
          .max(500)
          .nullable()
          .optional(),
      }),
    )
    .min(1),
});

export type UpdateStockTransactionInput = z.infer<
  typeof updateStockTransactionSchema
>;

export const deleteStockTransactionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const stockTransactionErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
