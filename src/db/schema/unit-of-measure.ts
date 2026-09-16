import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organization.js";

export const unitOfMeasureStatusEnum = pgEnum("unit_of_measure_status", [
  "ACTIVE",
  "INACTIVE",
]);

export const unitsOfMeasure = pgTable(
  "units_of_measure",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 30 }).notNull(),
    description: varchar("description", { length: 500 }),

    status: unitOfMeasureStatusEnum("status").default("ACTIVE").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("units_of_measure_org_code_unique").on(
      table.organizationId,
      table.code,
    ),
    index("units_of_measure_organization_id_idx").on(table.organizationId),
  ],
);
