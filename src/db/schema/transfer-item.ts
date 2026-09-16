import {
  decimal,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { assets } from "./asset.js";
import { items } from "./item.js";
import { transfers } from "./transfer.js";

export const transferItems = pgTable(
  "transfer_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    transferId: uuid("transfer_id")
      .notNull()
      .references(() => transfers.id, {
        onDelete: "cascade",
      }),

    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id),

    assetId: uuid("asset_id").references(() => assets.id),

    quantity: decimal("quantity", {
      precision: 14,
      scale: 2,
    }).notNull(),

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
    index("transfer_items_transfer_id_idx").on(table.transferId),
    index("transfer_items_item_id_idx").on(table.itemId),
    index("transfer_items_asset_id_idx").on(table.assetId),
  ],
);
