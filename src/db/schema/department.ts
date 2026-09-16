import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organization.js";
import { sites } from "./site.js";

export const departmentStatusEnum = pgEnum("department_status", [
  "ACTIVE",
  "INACTIVE",
]);

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 150 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    description: varchar("description", { length: 500 }),
    managerId: uuid("manager_id"),
    status: departmentStatusEnum("status").default("ACTIVE").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("departments_org_code_unique").on(table.organizationId, table.code),
    index("departments_organization_id_idx").on(table.organizationId),
    index("departments_site_id_idx").on(table.siteId),
    index("departments_manager_id_idx").on(table.managerId),
  ],
);
