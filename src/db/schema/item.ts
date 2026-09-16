import {
  boolean,
  decimal,
  index,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { itemCategories } from "./item-category.js";
import { organizations } from "./organization.js";
import { unitsOfMeasure } from "./unit-of-measure.js";

export const itemTypeEnum = pgEnum("item_type", ["CONSUMABLE", "ASSET"]);

export const itemStatusEnum = pgEnum("item_status", ["ACTIVE", "INACTIVE"]);

export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    categoryId: uuid("category_id")
      .notNull()
      .references(() => itemCategories.id),

    unitOfMeasureId: uuid("unit_of_measure_id")
      .notNull()
      .references(() => unitsOfMeasure.id),

    name: varchar("name", { length: 200 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    sku: varchar("sku", { length: 100 }).notNull(),
    description: varchar("description", { length: 1000 }),
    brand: varchar("brand", { length: 100 }),
    model: varchar("model", { length: 100 }),

    itemType: itemTypeEnum("item_type").notNull(),
    isTrackable: boolean("is_trackable").default(false).notNull(),
    isSerialized: boolean("is_serialized").default(false).notNull(),
    isBatchTracked: boolean("is_batch_tracked").default(false).notNull(),

    minimumStock: decimal("minimum_stock", { precision: 12, scale: 2 }),
    maximumStock: decimal("maximum_stock", { precision: 12, scale: 2 }),
    reorderLevel: decimal("reorder_level", { precision: 12, scale: 2 }),

    status: itemStatusEnum("status").default("ACTIVE").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("items_org_code_unique").on(table.organizationId, table.code),
    unique("items_org_sku_unique").on(table.organizationId, table.sku),
    index("items_organization_id_idx").on(table.organizationId),
    index("items_category_id_idx").on(table.categoryId),
    index("items_unit_of_measure_id_idx").on(table.unitOfMeasureId),
    index("items_status_idx").on(table.status),
  ],
);
