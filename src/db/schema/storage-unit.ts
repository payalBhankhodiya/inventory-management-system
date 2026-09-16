import {
  foreignKey,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization.js";
import { storageAreas } from "./storage-area.js";

export const storageUnitTypeEnum = pgEnum("storage_unit_type", [
  "RACK",
  "SHELF",
  "CABINET",
  "BIN",
  "LOCKER",
  "DRAWER",
  "OTHER",
]);

export const storageUnitStatusEnum = pgEnum("storage_unit_status", [
  "ACTIVE",
  "INACTIVE",
]);

export const storageUnits = pgTable(
  "storage_units",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    storageAreaId: uuid("storage_area_id")
      .notNull()
      .references(() => storageAreas.id, { onDelete: "cascade" }),

    parentId: uuid("parent_id"),

    name: varchar("name", { length: 150 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    type: storageUnitTypeEnum("type").notNull(),
    description: varchar("description", { length: 500 }),
    capacity: integer("capacity"),

    status: storageUnitStatusEnum("status").default("ACTIVE").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("storage_units_org_code_unique").on(
      table.organizationId,
      table.code,
    ),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "storage_units_parent_id_fk",
    }),
  ],
);
