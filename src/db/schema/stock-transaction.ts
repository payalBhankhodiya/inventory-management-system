import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organization.js";
import { users } from "./user.js";

export const stockTransactionTypeEnum = pgEnum("stock_transaction_type", [
  "RECEIPT",
  "ISSUE",
  "TRANSFER",
  "RETURN",
  "ADJUSTMENT",
  "DISPOSAL",
]);

export const stockTransactions = pgTable(
  "stock_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    transactionNo: varchar("transaction_no", {
      length: 100,
    })
      .notNull()
      .unique(),

    type: stockTransactionTypeEnum("type").notNull(),

    referenceType: varchar("reference_type", {
      length: 100,
    }),

    referenceId: uuid("reference_id"),

    reason: varchar("reason", {
      length: 500,
    }),

    remarks: varchar("remarks", {
      length: 1000,
    }),

    performedBy: uuid("performed_by")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("stock_transactions_organization_id_idx").on(table.organizationId),
    index("stock_transactions_performed_by_idx").on(table.performedBy),
    index("stock_transactions_type_idx").on(table.type),
    index("stock_transactions_created_at_idx").on(table.createdAt),
  ],
);
