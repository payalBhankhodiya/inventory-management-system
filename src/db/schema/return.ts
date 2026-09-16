import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { assets } from "./asset.js";
import { assignments } from "./assignment.js";
import { departments } from "./department.js";
import { organizations } from "./organization.js";
import { sites } from "./site.js";
import { storageAreas } from "./storage-area.js";
import { storageUnits } from "./storage-unit.js";
import { users } from "./user.js";

export const returnStatusEnum = pgEnum("return_status", [
  "RECEIVED",
  "INSPECTED",
  "COMPLETED",
  "REJECTED",
]);

export const returns = pgTable(
  "returns",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assignments.id),

    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id),

    returnedByUserId: uuid("returned_by_user_id")
      .notNull()
      .references(() => users.id),

    receivedByUserId: uuid("received_by_user_id")
      .notNull()
      .references(() => users.id),

    returnSiteId: uuid("return_site_id")
      .notNull()
      .references(() => sites.id),

    returnDepartmentId: uuid("return_department_id").references(
      () => departments.id,
    ),

    returnStorageAreaId: uuid("return_storage_area_id").references(
      () => storageAreas.id,
    ),

    returnStorageUnitId: uuid("return_storage_unit_id").references(
      () => storageUnits.id,
    ),

    returnDate: timestamp("return_date", {
      withTimezone: true,
    }).notNull(),

    condition: varchar("condition", {
      length: 30,
    }).notNull(),

    damageDescription: varchar("damage_description", {
      length: 1000,
    }),

    remarks: varchar("remarks", {
      length: 1000,
    }),

    status: returnStatusEnum("status").default("RECEIVED").notNull(),

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
    index("returns_organization_id_idx").on(table.organizationId),
    index("returns_assignment_id_idx").on(table.assignmentId),
    index("returns_asset_id_idx").on(table.assetId),
    index("returns_returned_by_user_id_idx").on(table.returnedByUserId),
    index("returns_received_by_user_id_idx").on(table.receivedByUserId),
    index("returns_return_site_id_idx").on(table.returnSiteId),
    index("returns_status_idx").on(table.status),
  ],
);
