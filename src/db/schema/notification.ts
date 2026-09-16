import {
  boolean,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organization.js";
import { users } from "./user.js";

export const notificationTypeEnum = pgEnum("notification_type", [
  "LOW_STOCK",
  "TRANSFER_REQUESTED",
  "TRANSFER_APPROVED",
  "TRANSFER_COMPLETED",
  "ASSET_ASSIGNED",
  "ASSET_RETURNED",
  "MAINTENANCE",
  "SYSTEM",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    type: notificationTypeEnum("type").notNull(),

    title: varchar("title", {
      length: 200,
    }).notNull(),

    message: varchar("message", {
      length: 1000,
    }).notNull(),

    entityType: varchar("entity_type", {
      length: 100,
    }),

    entityId: uuid("entity_id"),

    isRead: boolean("is_read").default(false).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    readAt: timestamp("read_at", {
      withTimezone: true,
    }),
  },
  (table) => [
    index("notifications_organization_id_idx").on(table.organizationId),
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_is_read_idx").on(table.isRead),
    index("notifications_created_at_idx").on(table.createdAt),
    index("notifications_entity_type_id_idx").on(
      table.entityType,
      table.entityId,
    ),
  ],
);
