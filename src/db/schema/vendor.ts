import {
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

export const vendorStatusEnum = pgEnum("vendor_status", ["ACTIVE", "INACTIVE"]);

export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 200 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    contactPerson: varchar("contact_person", { length: 150 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 30 }),
    address: jsonb("address"),
    taxNumber: varchar("tax_number", { length: 100 }),

    status: vendorStatusEnum("status").default("ACTIVE").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("vendors_org_code_unique").on(table.organizationId, table.code),
    index("vendors_organization_id_idx").on(table.organizationId),
    index("vendors_status_idx").on(table.status),
  ],
);
