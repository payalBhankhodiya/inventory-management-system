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
import { vendors } from "./vendor.js";
import { users } from "./user.js";

export const maintenancePriorityEnum = pgEnum("maintenance_priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_PARTS",
  "COMPLETED",
  "CANCELLED",
]);

export const maintenances = pgTable(
  "maintenances",
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

    reportedBy: uuid("reported_by")
      .notNull()
      .references(() => users.id),

    vendorId: uuid("vendor_id").references(() => vendors.id),

    issue: varchar("issue", {
      length: 300,
    }).notNull(),

    description: varchar("description", {
      length: 1000,
    }),

    priority: maintenancePriorityEnum("priority").default("MEDIUM").notNull(),

    startDate: timestamp("start_date", {
      withTimezone: true,
    }),

    expectedCompletionDate: timestamp("expected_completion_date", {
      withTimezone: true,
    }),

    completedDate: timestamp("completed_date", {
      withTimezone: true,
    }),

    cost: decimal("cost", {
      precision: 14,
      scale: 2,
    }),

    resolution: varchar("resolution", {
      length: 1000,
    }),

    status: maintenanceStatusEnum("status").default("OPEN").notNull(),

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
    index("maintenances_organization_id_idx").on(table.organizationId),
    index("maintenances_asset_id_idx").on(table.assetId),
    index("maintenances_reported_by_idx").on(table.reportedBy),
    index("maintenances_vendor_id_idx").on(table.vendorId),
    index("maintenances_status_idx").on(table.status),
    index("maintenances_priority_idx").on(table.priority),
  ],
);
