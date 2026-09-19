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
import { roles } from "./role.js";

export const userStatusEnum = pgEnum("user_status", [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", { length: 150 }).notNull(),

    email: varchar("email", { length: 255 }).notNull().unique(),

    passwordHash: varchar("password_hash", {
      length: 255,
    }).notNull(),

    emailVerified: boolean("email_verified")
      .default(false)
      .notNull(),

    emailVerificationToken: varchar("email_verification_token", {
      length: 255,
    }),

    emailVerificationExpiresAt: timestamp(
      "email_verification_expires_at",
      {
        withTimezone: true,
      },
    ),

    employeeCode: varchar("employee_code", {
      length: 50,
    }),

    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),

    departmentId: uuid("department_id"),

    siteId: uuid("site_id"),

    status: userStatusEnum("status").default("ACTIVE").notNull(),

    lastLoginAt: timestamp("last_login_at", {
      withTimezone: true,
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
    index("users_organization_id_idx").on(table.organizationId),
    index("users_role_id_idx").on(table.roleId),
    index("users_department_id_idx").on(table.departmentId),
    index("users_site_id_idx").on(table.siteId),
  ],
);
