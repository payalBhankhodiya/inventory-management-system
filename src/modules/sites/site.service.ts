import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { sites } from "../../db/schema/site.js";

import type {
  CreateSiteInput,
  SitesListQuery,
  UpdateSiteInput,
} from "./site.schema.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";
import { AuditInfo } from "../../types/audit.js";

export async function getSites(organizationId: string, query: SitesListQuery) {
  const conditions = [eq(sites.organizationId, organizationId)];

  if (query.search) {
    conditions.push(
      or(
        ilike(sites.name, `%${query.search}%`),
        ilike(sites.code, `%${query.search}%`),
      )!,
    );
  }

  if (query.status) {
    conditions.push(eq(sites.status, query.status));
  }

  if (query.isMain !== undefined) {
    conditions.push(eq(sites.isMain, query.isMain));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(sites)
    .where(and(...conditions))
    .orderBy(desc(sites.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(sites)
    .where(and(...conditions));

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

export async function getSiteById(organizationId: string, siteId: string) {
  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.organizationId, organizationId)),
  });

  if (!site) {
    throw new Error("Site not found");
  }

  return site;
}

export async function createSite(input: CreateSiteInput, auditInfo: AuditInfo) {
  const existingSite = await db.query.sites.findFirst({
    where: and(
      eq(sites.organizationId, input.organizationId),
      eq(sites.code, input.code),
    ),
  });

  if (existingSite) {
    throw new Error("Site with this code already exists");
  }

  if (input.isMain) {
    await db
      .update(sites)
      .set({
        isMain: false,
        updatedAt: new Date(),
      })
      .where(eq(sites.organizationId, input.organizationId));
  }

  const [site] = await db
    .insert(sites)
    .values({
      organizationId: input.organizationId,
      name: input.name,
      code: input.code,
      isMain: input.isMain,
      address: input.address,
      managerId: input.managerId,
      status: input.status,
    })
    .returning();

  if (!site) {
    throw new Error("Failed to create site");
  }

  await createAuditLog({
    organizationId: site.organizationId,
    userId: auditInfo.userId,
    action: "CREATE",
    entityType: "SITE",
    entityId: site.id,
    oldValue: null,
    newValue: site,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return site;
}

export async function updateSite(
  organizationId: string,
  siteId: string,
  input: UpdateSiteInput,
  auditInfo: AuditInfo,
) {
  const existingSite = await db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.organizationId, organizationId)),
  });

  if (!existingSite) {
    throw new Error("Site not found");
  }
  if (input.code && input.code !== existingSite.code) {
    const duplicateSite = await db.query.sites.findFirst({
      where: and(
        eq(sites.organizationId, organizationId),
        eq(sites.code, input.code),
      ),
    });

    if (duplicateSite) {
      throw new Error("Site with this code already exists");
    }
  }

  if (input.isMain === true) {
    await db
      .update(sites)
      .set({
        isMain: false,
        updatedAt: new Date(),
      })
      .where(eq(sites.organizationId, organizationId));
  }

  const [site] = await db
    .update(sites)
    .set({
      name: input.name,
      code: input.code,
      isMain: input.isMain,
      address: input.address,
      managerId: input.managerId,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(and(eq(sites.id, siteId), eq(sites.organizationId, organizationId)))
    .returning();

  if (!site) {
    throw new Error("Failed to update site");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "SITE",
    entityId: site.id,
    oldValue: existingSite,
    newValue: site,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return site;
}

export async function deleteSite(
  organizationId: string,
  siteId: string,
  auditInfo: AuditInfo,
) {
  const existingSite = await db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.organizationId, organizationId)),
  });

  if (!existingSite) {
    throw new Error("Site not found");
  }
  if (existingSite.status === "INACTIVE") {
    throw new Error("Site is already inactive");
  }

  const [site] = await db
    .update(sites)
    .set({
      status: "INACTIVE",
      updatedAt: new Date(),
    })
    .where(and(eq(sites.id, siteId), eq(sites.organizationId, organizationId)))
    .returning();

  if (!site) {
    throw new Error("Failed to deactivate site");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "DELETE",
    entityType: "SITE",
    entityId: site.id,
    oldValue: existingSite,
    newValue: site,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return site;
}
