import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { sites } from "../../db/schema/site.js";

import type {
  CreateSiteInput,
  SitesListQuery,
  UpdateSiteInput,
} from "./site.schema.js";

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

export async function createSite(input: CreateSiteInput) {
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

  return site;
}

export async function updateSite(
  organizationId: string,
  siteId: string,
  input: UpdateSiteInput,
) {
  const existingSite = await getSiteById(organizationId, siteId);

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

  return site;
}

export async function deleteSite(organizationId: string, siteId: string) {
  const existingSite = await getSiteById(organizationId, siteId);

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

  return site;
}
