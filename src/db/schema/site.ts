import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organization.js";

export const siteStatusEnum = pgEnum("site_status", ["ACTIVE", "INACTIVE"]);

export const sites = pgTable(
  "sites",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 150 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    isMain: boolean("is_main").default(false).notNull(),
    address: jsonb("address"),
    managerId: uuid("manager_id"),
    status: siteStatusEnum("status").default("ACTIVE").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("sites_org_code_unique").on(table.organizationId, table.code),
    index("sites_organization_id_idx").on(table.organizationId),
    index("sites_manager_id_idx").on(table.managerId),
  ],
);
