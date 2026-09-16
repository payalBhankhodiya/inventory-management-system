import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { assetConditionEnum, assets } from "./asset.js";
import { departments } from "./department.js";
import { organizations } from "./organization.js";
import { sites } from "./site.js";
import { users } from "./user.js";

export const assignmentStatusEnum = pgEnum("assignment_status", [
  "ASSIGNED",
  "RETURNED",
  "CANCELLED",
]);

export const assignments = pgTable(
  "assignments",
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

    assignedToUserId: uuid("assigned_to_user_id")
      .notNull()
      .references(() => users.id),

    assignedByUserId: uuid("assigned_by_user_id")
      .notNull()
      .references(() => users.id),

    departmentId: uuid("department_id").references(() => departments.id),

    siteId: uuid("site_id").references(() => sites.id),

    assignedAt: timestamp("assigned_at", {
      withTimezone: true,
    }).notNull(),

    expectedReturnDate: timestamp("expected_return_date", {
      withTimezone: true,
    }),

    returnedAt: timestamp("returned_at", {
      withTimezone: true,
    }),

    conditionAtAssignment: assetConditionEnum("condition_at_assignment"),

    conditionAtReturn: assetConditionEnum("condition_at_return"),

    remarks: varchar("remarks", {
      length: 1000,
    }),

    status: assignmentStatusEnum("status").default("ASSIGNED").notNull(),

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
    index("assignments_organization_id_idx").on(table.organizationId),
    index("assignments_asset_id_idx").on(table.assetId),
    index("assignments_assigned_to_user_id_idx").on(table.assignedToUserId),
    index("assignments_assigned_by_user_id_idx").on(table.assignedByUserId),
    index("assignments_department_id_idx").on(table.departmentId),
    index("assignments_site_id_idx").on(table.siteId),
    index("assignments_status_idx").on(table.status),
  ],
);
