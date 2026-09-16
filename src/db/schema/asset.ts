import {
  date,
  decimal,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { items } from "./item.js";
import { organizations } from "./organization.js";
import { vendors } from "./vendor.js";
import { sites } from "./site.js";
import { departments } from "./department.js";
import { storageAreas } from "./storage-area.js";
import { storageUnits } from "./storage-unit.js";

export const assetConditionEnum = pgEnum("asset_condition", [
  "NEW",
  "GOOD",
  "FAIR",
  "DAMAGED",
]);

export const assetStatusEnum = pgEnum("asset_status", [
  "AVAILABLE",
  "ASSIGNED",
  "IN_TRANSIT",
  "UNDER_MAINTENANCE",
  "DAMAGED",
  "LOST",
  "DISPOSED",
]);

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id),

    assetTag: varchar("asset_tag", {
      length: 100,
    })
      .notNull()
      .unique(),

    serialNumber: varchar("serial_number", {
      length: 150,
    }),

    barcode: varchar("barcode", {
      length: 150,
    }),

    vendorId: uuid("vendor_id").references(() => vendors.id),

    purchaseDate: date("purchase_date"),

    purchasePrice: decimal("purchase_price", {
      precision: 14,
      scale: 2,
    }),

    warrantyStartDate: date("warranty_start_date"),

    warrantyEndDate: date("warranty_end_date"),

    condition: assetConditionEnum("condition").default("NEW").notNull(),

    status: assetStatusEnum("status").default("AVAILABLE").notNull(),

    siteId: uuid("site_id").references(() => sites.id),

    departmentId: uuid("department_id").references(() => departments.id),

    storageAreaId: uuid("storage_area_id").references(() => storageAreas.id),

    storageUnitId: uuid("storage_unit_id").references(() => storageUnits.id),

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
    index("assets_organization_id_idx").on(table.organizationId),
    index("assets_item_id_idx").on(table.itemId),
    index("assets_vendor_id_idx").on(table.vendorId),
    index("assets_site_id_idx").on(table.siteId),
    index("assets_department_id_idx").on(table.departmentId),
    index("assets_storage_area_id_idx").on(table.storageAreaId),
    index("assets_storage_unit_id_idx").on(table.storageUnitId),
    index("assets_status_idx").on(table.status),
  ],
);
