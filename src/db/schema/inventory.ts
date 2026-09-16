import { decimal, index, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { items } from "./item.js";
import { organizations } from "./organization.js";
import { storageAreas } from "./storage-area.js";
import { storageUnits } from "./storage-unit.js";

export const inventories = pgTable(
  "inventories",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id),

    storageAreaId: uuid("storage_area_id")
      .notNull()
      .references(() => storageAreas.id),

    storageUnitId: uuid("storage_unit_id")
      .notNull()
      .references(() => storageUnits.id),

    quantity: decimal("quantity", {
      precision: 14,
      scale: 2,
    })
      .default("0")
      .notNull(),

    reservedQuantity: decimal("reserved_quantity", {
      precision: 14,
      scale: 2,
    })
      .default("0")
      .notNull(),

    availableQuantity: decimal("available_quantity", {
      precision: 14,
      scale: 2,
    })
      .default("0")
      .notNull(),

    minimumStock: decimal("minimum_stock", {
      precision: 14,
      scale: 2,
    }),

    reorderLevel: decimal("reorder_level", {
      precision: 14,
      scale: 2,
    }),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("inventories_location_item_unique").on(
      table.organizationId,
      table.itemId,
      table.storageAreaId,
      table.storageUnitId,
    ),
    index("inventories_organization_id_idx").on(table.organizationId),
    index("inventories_item_id_idx").on(table.itemId),
    index("inventories_storage_area_id_idx").on(table.storageAreaId),
    index("inventories_storage_unit_id_idx").on(table.storageUnitId),
  ],
);
