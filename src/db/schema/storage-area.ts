import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { departments } from "./department.js";
import { organizations } from "./organization.js";
import { sites } from "./site.js";

export const storageAreaStatusEnum = pgEnum("storage_area_status", [
  "ACTIVE",
  "INACTIVE",
]);

export const storageAreas = pgTable(
  "storage_areas",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),

    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 150 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    description: varchar("description", { length: 500 }),
    managerId: uuid("manager_id"),
    status: storageAreaStatusEnum("status").default("ACTIVE").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("storage_areas_org_code_unique").on(
      table.organizationId,
      table.code,
    ),
    index("storage_areas_organization_id_idx").on(table.organizationId),
    index("storage_areas_site_id_idx").on(table.siteId),
    index("storage_areas_department_id_idx").on(table.departmentId),
    index("storage_areas_manager_id_idx").on(table.managerId),
  ],
);
