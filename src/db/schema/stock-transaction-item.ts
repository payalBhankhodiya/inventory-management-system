import {
  decimal,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { items } from "./item.js";
import { stockTransactions } from "./stock-transaction.js";
import { storageAreas } from "./storage-area.js";
import { storageUnits } from "./storage-unit.js";

export const stockTransactionItems = pgTable(
  "stock_transaction_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    stockTransactionId: uuid("stock_transaction_id")
      .notNull()
      .references(() => stockTransactions.id, {
        onDelete: "cascade",
      }),

    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id),

    fromStorageAreaId: uuid("from_storage_area_id").references(
      () => storageAreas.id,
    ),

    fromStorageUnitId: uuid("from_storage_unit_id").references(
      () => storageUnits.id,
    ),

    toStorageAreaId: uuid("to_storage_area_id").references(
      () => storageAreas.id,
    ),

    toStorageUnitId: uuid("to_storage_unit_id").references(
      () => storageUnits.id,
    ),

    quantity: decimal("quantity", {
      precision: 14,
      scale: 2,
    }).notNull(),

    unitCost: decimal("unit_cost", {
      precision: 14,
      scale: 2,
    }),

    remarks: varchar("remarks", {
      length: 1000,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("stock_transaction_items_transaction_id_idx").on(
      table.stockTransactionId,
    ),
    index("stock_transaction_items_item_id_idx").on(table.itemId),
    index("stock_transaction_items_from_area_id_idx").on(
      table.fromStorageAreaId,
    ),
    index("stock_transaction_items_from_unit_id_idx").on(
      table.fromStorageUnitId,
    ),
    index("stock_transaction_items_to_area_id_idx").on(table.toStorageAreaId),
    index("stock_transaction_items_to_unit_id_idx").on(table.toStorageUnitId),
  ],
);
