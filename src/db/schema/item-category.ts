import {
  foreignKey,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organization.js";

export const itemCategoryStatusEnum = pgEnum("item_category_status", [
  "ACTIVE",
  "INACTIVE",
]);

export const itemCategories = pgTable(
  "item_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 150 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    description: varchar("description", { length: 500 }),
    parentId: uuid("parent_id"),
    status: itemCategoryStatusEnum("status").default("ACTIVE").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("item_categories_org_code_unique").on(
      table.organizationId,
      table.code,
    ),
    index("item_categories_organization_id_idx").on(table.organizationId),
    index("item_categories_parent_id_idx").on(table.parentId),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "item_categories_parent_id_fk",
    }),
  ],
);
