import {
  index,
  inet,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organization.js";
import { users } from "./user.js";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id").references(() => users.id),

    action: varchar("action", {
      length: 100,
    }).notNull(),

    entityType: varchar("entity_type", {
      length: 100,
    }).notNull(),

    entityId: uuid("entity_id"),

    oldValue: jsonb("old_value"),

    newValue: jsonb("new_value"),

    ipAddress: inet("ip_address"),

    userAgent: varchar("user_agent", {
      length: 1000,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("audit_logs_organization_id_idx").on(table.organizationId),
    index("audit_logs_user_id_idx").on(table.userId),
    index("audit_logs_entity_type_id_idx").on(table.entityType, table.entityId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);
