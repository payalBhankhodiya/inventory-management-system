import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { organizations } from "../../db/schema/organization.js";

import type {
  CreateOrganizationInput,
  OrganizationListQuery,
  UpdateOrganizationInput,
} from "./organization.schema.js";

export async function getOrganizations(query: OrganizationListQuery) {
  const conditions = [];

  if (query.search) {
    conditions.push(
      or(
        ilike(organizations.name, `%${query.search}%`),
        ilike(organizations.code, `%${query.search}%`),
        ilike(organizations.email, `%${query.search}%`),
      )!,
    );
  }

  if (query.status) {
    conditions.push(eq(organizations.status, query.status));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(organizations)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(organizations.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(organizations)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getOrganizationById(organizationId: string) {
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  return organization;
}

export async function createOrganization(input: CreateOrganizationInput) {
  const existing = await db.query.organizations.findFirst({
    where: eq(organizations.code, input.code),
  });

  if (existing) {
    throw new Error("Organization code already exists");
  }

  const [organization] = await db
    .insert(organizations)
    .values({
      name: input.name,
      code: input.code,
      email: input.email,
      phone: input.phone,
      address: input.address,
      status: input.status,
    })
    .returning();

  if (!organization) {
    throw new Error("Failed to create organization");
  }

  return organization;
}

export async function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationInput,
) {
  await getOrganizationById(organizationId);

  if (input.code) {
    const existing = await db.query.organizations.findFirst({
      where: and(
        eq(organizations.code, input.code),
        sql`${organizations.id} <> ${organizationId}`,
      ),
    });

    if (existing) {
      throw new Error("Organization code already exists");
    }
  }

  const [organization] = await db
    .update(organizations)
    .set({
      name: input.name,
      code: input.code,
      email: input.email,
      phone: input.phone,
      address: input.address,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId))
    .returning();

  if (!organization) {
    throw new Error("Failed to update organization");
  }

  return organization;
}

export async function deleteOrganization(organizationId: string) {
  await getOrganizationById(organizationId);

  const [organization] = await db
    .update(organizations)
    .set({
      status: "INACTIVE",
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId))
    .returning();

  if (!organization) {
    throw new Error("Failed to deactivate organization");
  }

  return organization;
}
