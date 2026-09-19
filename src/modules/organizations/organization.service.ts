import {
  and,
  desc,
  eq,
  ilike,
  or,
  sql,
} from "drizzle-orm";

import { db } from "../../db/index.js";
import { organizations } from "../../db/schema/organization.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";

import type {
  CreateOrganizationInput,
  OrganizationListQuery,
  UpdateOrganizationInput,
} from "./organization.schema.js";
import { AuditInfo } from "../../types/audit.js";


export async function getOrganizations(
  query: OrganizationListQuery,
) {
  const conditions = [];

  if (query.search) {
    conditions.push(
      or(
        ilike(
          organizations.name,
          `%${query.search}%`,
        ),
        ilike(
          organizations.code,
          `%${query.search}%`,
        ),
        ilike(
          organizations.email,
          `%${query.search}%`,
        ),
      )!,
    );
  }

  if (query.status) {
    conditions.push(
      eq(organizations.status, query.status),
    );
  }

  const offset =
    (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(organizations)
    .where(
      conditions.length > 0
        ? and(...conditions)
        : undefined,
    )
    .orderBy(desc(organizations.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(organizations)
    .where(
      conditions.length > 0
        ? and(...conditions)
        : undefined,
    );

  const total = Number(
    countResult[0]?.count ?? 0,
  );

  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(
        total / query.limit,
      ),
    },
  };
}

export async function getOrganizationById(
  organizationId: string,
) {
  const organization =
    await db.query.organizations.findFirst({
      where: eq(
        organizations.id,
        organizationId,
      ),
    });

  if (!organization) {
    throw new Error(
      "Organization not found",
    );
  }

  return organization;
}

export async function createOrganization(
  input: CreateOrganizationInput,
  auditInfo: AuditInfo,
) {
  const existing =
    await db.query.organizations.findFirst({
      where: eq(
        organizations.code,
        input.code,
      ),
    });

  if (existing) {
    throw new Error(
      "Organization code already exists",
    );
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
    throw new Error(
      "Failed to create organization",
    );
  }

  await createAuditLog({
    organizationId: organization.id,
    userId: auditInfo.userId,
    action: "CREATE",
    entityType: "ORGANIZATION",
    entityId: organization.id,
    oldValue: null,
    newValue: organization,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return organization;
}

export async function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationInput,
  auditInfo: AuditInfo,
) {
  const existing =
    await getOrganizationById(
      organizationId,
    );

  if (input.code) {
    const duplicate =
      await db.query.organizations.findFirst({
        where: and(
          eq(
            organizations.code,
            input.code,
          ),
          sql`${organizations.id} <> ${organizationId}`,
        ),
      });

    if (duplicate) {
      throw new Error(
        "Organization code already exists",
      );
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
    .where(
      eq(
        organizations.id,
        organizationId,
      ),
    )
    .returning();

  if (!organization) {
    throw new Error(
      "Failed to update organization",
    );
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "ORGANIZATION",
    entityId: organizationId,
    oldValue: existing,
    newValue: organization,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return organization;
}

export async function deleteOrganization(
  organizationId: string,
  auditInfo: AuditInfo,
) {
  const existing =
    await getOrganizationById(
      organizationId,
    );

  const [organization] = await db
    .update(organizations)
    .set({
      status: "INACTIVE",
      updatedAt: new Date(),
    })
    .where(
      eq(
        organizations.id,
        organizationId,
      ),
    )
    .returning();

  if (!organization) {
    throw new Error(
      "Failed to deactivate organization",
    );
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "DELETE",
    entityType: "ORGANIZATION",
    entityId: organizationId,
    oldValue: existing,
    newValue: organization,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return organization;
}