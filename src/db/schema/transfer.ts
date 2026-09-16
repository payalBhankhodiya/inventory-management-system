import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organization.js";
import { storageAreas } from "./storage-area.js";
import { storageUnits } from "./storage-unit.js";
import { users } from "./user.js";

export const transferStatusEnum = pgEnum("transfer_status", [
  "DRAFT",
  "REQUESTED",
  "APPROVED",
  "IN_TRANSIT",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
]);

export const transfers = pgTable(
  "transfers",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    referenceNo: varchar("reference_no", {
      length: 100,
    })
      .notNull()
      .unique(),

    fromStorageAreaId: uuid("from_storage_area_id")
      .notNull()
      .references(() => storageAreas.id),

    fromStorageUnitId: uuid("from_storage_unit_id")
      .notNull()
      .references(() => storageUnits.id),

    toStorageAreaId: uuid("to_storage_area_id")
      .notNull()
      .references(() => storageAreas.id),

    toStorageUnitId: uuid("to_storage_unit_id")
      .notNull()
      .references(() => storageUnits.id),

    requestedBy: uuid("requested_by")
      .notNull()
      .references(() => users.id),

    approvedBy: uuid("approved_by").references(() => users.id),

    transferDate: timestamp("transfer_date", {
      withTimezone: true,
    }),

    status: transferStatusEnum("status").default("DRAFT").notNull(),

    reason: varchar("reason", {
      length: 500,
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
    index("transfers_organization_id_idx").on(table.organizationId),
    index("transfers_from_storage_area_id_idx").on(table.fromStorageAreaId),
    index("transfers_from_storage_unit_id_idx").on(table.fromStorageUnitId),
    index("transfers_to_storage_area_id_idx").on(table.toStorageAreaId),
    index("transfers_to_storage_unit_id_idx").on(table.toStorageUnitId),
    index("transfers_requested_by_idx").on(table.requestedBy),
    index("transfers_approved_by_idx").on(table.approvedBy),
    index("transfers_status_idx").on(table.status),
  ],
);
