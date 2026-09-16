import {
  decimal,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { assets } from "./asset.js";
import { organizations } from "./organization.js";
import { users } from "./user.js";

export const disposalMethodEnum = pgEnum("disposal_method", [
  "SCRAP",
  "RECYCLE",
  "SELL",
  "DONATE",
  "DESTROY",
  "OTHER",
]);

export const disposals = pgTable(
  "disposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id),

    reason: varchar("reason", {
      length: 500,
    }).notNull(),

    disposalDate: timestamp("disposal_date", {
      withTimezone: true,
    }).notNull(),

    disposalMethod: disposalMethodEnum("disposal_method").notNull(),

    approvedBy: uuid("approved_by")
      .notNull()
      .references(() => users.id),

    disposedBy: uuid("disposed_by")
      .notNull()
      .references(() => users.id),

    residualValue: decimal("residual_value", {
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

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("disposals_organization_id_idx").on(table.organizationId),
    index("disposals_asset_id_idx").on(table.assetId),
    index("disposals_approved_by_idx").on(table.approvedBy),
    index("disposals_disposed_by_idx").on(table.disposedBy),
    index("disposals_disposal_date_idx").on(table.disposalDate),
  ],
);
