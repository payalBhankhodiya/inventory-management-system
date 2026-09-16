import { pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 150 }).notNull(),
    description: varchar("description", { length: 500 }),
    module: varchar("module", { length: 100 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("permissions_module_action_unique").on(table.module, table.action),
  ],
);
