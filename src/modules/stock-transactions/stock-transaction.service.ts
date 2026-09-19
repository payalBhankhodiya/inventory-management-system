import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { stockTransactions } from "../../db/schema/stock-transaction.js";
import { stockTransactionItems } from "../../db/schema/stock-transaction-item.js";

import type {
  CreateStockTransactionInput,
  StockTransactionsListQuery,
  UpdateStockTransactionInput,
} from "./stock-transaction.schema.js";
import { AuditInfo } from "../../types/audit.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";

export async function getStockTransactions(
  organizationId: string,
  query: StockTransactionsListQuery,
) {
  const conditions = [eq(stockTransactions.organizationId, organizationId)];

  if (query.search) {
    conditions.push(
      or(
        ilike(stockTransactions.transactionNo, `%${query.search}%`),
        ilike(stockTransactions.referenceType, `%${query.search}%`),
        ilike(stockTransactions.reason, `%${query.search}%`),
      )!,
    );
  }

  if (query.type) {
    conditions.push(eq(stockTransactions.type, query.type));
  }

  if (query.performedBy) {
    conditions.push(eq(stockTransactions.performedBy, query.performedBy));
  }

  const offset = (query.page - 1) * query.limit;

  const transactions = await db
    .select()
    .from(stockTransactions)
    .where(and(...conditions))
    .orderBy(desc(stockTransactions.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(stockTransactions)
    .where(and(...conditions));

  const total = Number(countResult[0]?.count ?? 0);

  const data = await Promise.all(
    transactions.map(async (transaction) => {
      const items = await db
        .select()
        .from(stockTransactionItems)
        .where(eq(stockTransactionItems.stockTransactionId, transaction.id));

      return {
        ...transaction,
        items,
      };
    }),
  );

  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getStockTransactionById(
  organizationId: string,
  transactionId: string,
) {
  const transaction = await db.query.stockTransactions.findFirst({
    where: and(
      eq(stockTransactions.id, transactionId),
      eq(stockTransactions.organizationId, organizationId),
    ),
  });

  if (!transaction) {
    throw new Error("Stock transaction not found");
  }

  const items = await db
    .select()
    .from(stockTransactionItems)
    .where(eq(stockTransactionItems.stockTransactionId, transaction.id));

  return {
    ...transaction,
    items,
  };
}

export async function createStockTransaction(
  input: CreateStockTransactionInput,
  auditInfo: AuditInfo,
) {
  const existingTransaction = await db.query.stockTransactions.findFirst({
    where: eq(stockTransactions.transactionNo, input.transactionNo),
  });

  if (existingTransaction) {
    throw new Error(
      "Stock transaction with this transaction number already exists",
    );
  }

  const result = await db.transaction(async (tx) => {
    const [transaction] = await tx
      .insert(stockTransactions)
      .values({
        organizationId: input.organizationId,
        transactionNo: input.transactionNo,
        type: input.type,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        reason: input.reason,
        remarks: input.remarks,
        performedBy: input.performedBy,
      })
      .returning();

    if (!transaction) {
      throw new Error("Failed to create stock transaction");
    }

    const transactionItems = await tx
      .insert(stockTransactionItems)
      .values(
        input.items.map((item) => ({
          stockTransactionId: transaction.id,
          itemId: item.itemId,

          fromStorageAreaId: item.fromStorageAreaId,
          fromStorageUnitId: item.fromStorageUnitId,

          toStorageAreaId: item.toStorageAreaId,
          toStorageUnitId: item.toStorageUnitId,

          quantity: item.quantity,
          unitCost: item.unitCost,

          remarks: item.remarks,
        })),
      )
      .returning();

    return {
      ...transaction,
      items: transactionItems,
    };
  });

  await createAuditLog({
    organizationId: result.organizationId,
    userId: auditInfo.userId,
    action: "CREATE",
    entityType: "STOCK_TRANSACTION",
    entityId: result.id,
    oldValue: null,
    newValue: result,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return result;
}

export async function updateStockTransaction(
  organizationId: string,
  transactionId: string,
  input: UpdateStockTransactionInput,
  auditInfo: AuditInfo,
) {
  const existingTransaction = await db.query.stockTransactions.findFirst({
    where: and(
      eq(stockTransactions.id, transactionId),
      eq(stockTransactions.organizationId, organizationId),
    ),
  });

  if (!existingTransaction) {
    throw new Error("Stock transaction not found");
  }

  const existingItems = await db
    .select()
    .from(stockTransactionItems)
    .where(eq(stockTransactionItems.stockTransactionId, transactionId));

  const result = await db.transaction(async (tx) => {
    const [transaction] = await tx
      .update(stockTransactions)
      .set({
        transactionNo: input.transactionNo,
        type: input.type,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        reason: input.reason,
        remarks: input.remarks,
        performedBy: input.performedBy,
      })
      .where(
        and(
          eq(stockTransactions.id, transactionId),
          eq(stockTransactions.organizationId, organizationId),
        ),
      )
      .returning();

    if (!transaction) {
      throw new Error("Failed to update stock transaction");
    }

    await tx
      .delete(stockTransactionItems)
      .where(eq(stockTransactionItems.stockTransactionId, transactionId));

    const transactionItems = await tx
      .insert(stockTransactionItems)
      .values(
        input.items.map((item) => ({
          stockTransactionId: transaction.id,
          itemId: item.itemId,

          fromStorageAreaId: item.fromStorageAreaId,
          fromStorageUnitId: item.fromStorageUnitId,

          toStorageAreaId: item.toStorageAreaId,
          toStorageUnitId: item.toStorageUnitId,

          quantity: item.quantity,
          unitCost: item.unitCost,

          remarks: item.remarks,
        })),
      )
      .returning();

    return {
      ...transaction,
      items: transactionItems,
    };
  });

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "STOCK_TRANSACTION",
    entityId: result.id,
    oldValue: {
      ...existingTransaction,
      items: existingItems,
    },
    newValue: result,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return result;
}

export async function deleteStockTransaction(
  organizationId: string,
  transactionId: string,
  auditInfo: AuditInfo,
) {
  const existingTransaction = await db.query.stockTransactions.findFirst({
    where: and(
      eq(stockTransactions.id, transactionId),
      eq(stockTransactions.organizationId, organizationId),
    ),
  });

  if (!existingTransaction) {
    throw new Error("Stock transaction not found");
  }

  const [deletedTransaction] = await db
    .delete(stockTransactions)
    .where(
      and(
        eq(stockTransactions.id, transactionId),
        eq(stockTransactions.organizationId, organizationId),
      ),
    )
    .returning();

  if (!deletedTransaction) {
    throw new Error("Failed to delete stock transaction");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "DELETE",
    entityType: "STOCK_TRANSACTION",
    entityId: transactionId,
    oldValue: existingTransaction,
    newValue: null,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return deletedTransaction;
}
