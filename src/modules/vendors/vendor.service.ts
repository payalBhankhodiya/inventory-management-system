import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { vendors } from "../../db/schema/vendor.js";

import type {
  CreateVendorInput,
  UpdateVendorInput,
  VendorsListQuery,
} from "./vendor.schema.js";
import { AuditInfo } from "../../types/audit.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";

export async function getVendors(
  organizationId: string,
  query: VendorsListQuery,
) {
  const conditions = [eq(vendors.organizationId, organizationId)];

  if (query.search) {
    conditions.push(
      or(
        ilike(vendors.name, `%${query.search}%`),
        ilike(vendors.code, `%${query.search}%`),
        ilike(vendors.contactPerson, `%${query.search}%`),
        ilike(vendors.email, `%${query.search}%`),
        ilike(vendors.phone, `%${query.search}%`),
      )!,
    );
  }

  if (query.status) {
    conditions.push(eq(vendors.status, query.status));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(vendors)
    .where(and(...conditions))
    .orderBy(desc(vendors.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(vendors)
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

export async function getVendorById(organizationId: string, vendorId: string) {
  const vendor = await db.query.vendors.findFirst({
    where: and(
      eq(vendors.id, vendorId),
      eq(vendors.organizationId, organizationId),
    ),
  });

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  return vendor;
}

export async function createVendor(
  input: CreateVendorInput,
  auditInfo: AuditInfo,
) {
  const existingVendor = await db.query.vendors.findFirst({
    where: and(
      eq(vendors.organizationId, input.organizationId),
      eq(vendors.code, input.code),
    ),
  });

  if (existingVendor) {
    throw new Error("Vendor with this code already exists");
  }

  const [vendor] = await db
    .insert(vendors)
    .values({
      organizationId: input.organizationId,
      name: input.name,
      code: input.code,
      contactPerson: input.contactPerson,
      email: input.email,
      phone: input.phone,
      address: input.address,
      taxNumber: input.taxNumber,
      status: input.status,
    })
    .returning();

  if (!vendor) {
    throw new Error("Failed to create vendor");
  }

  await createAuditLog({
    organizationId: vendor.organizationId,
    userId: auditInfo.userId,
    action: "CREATE",
    entityType: "VENDOR",
    entityId: vendor.id,
    oldValue: null,
    newValue: vendor,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return vendor;
}

export async function updateVendor(
  organizationId: string,
  vendorId: string,
  input: UpdateVendorInput,
  auditInfo: AuditInfo,
) {
  const existingVendor = await db.query.vendors.findFirst({
    where: and(
      eq(vendors.id, vendorId),
      eq(vendors.organizationId, organizationId),
    ),
  });

  if (!existingVendor) {
    throw new Error("Vendor not found");
  }

  if (input.code && input.code !== existingVendor.code) {
    const codeExists = await db.query.vendors.findFirst({
      where: and(
        eq(vendors.organizationId, organizationId),
        eq(vendors.code, input.code),
      ),
    });

    if (codeExists) {
      throw new Error("Vendor with this code already exists");
    }
  }

  const [vendor] = await db
    .update(vendors)
    .set({
      name: input.name,
      code: input.code,
      contactPerson: input.contactPerson,
      email: input.email,
      phone: input.phone,
      address: input.address,
      taxNumber: input.taxNumber,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(
      and(eq(vendors.id, vendorId), eq(vendors.organizationId, organizationId)),
    )
    .returning();

  if (!vendor) {
    throw new Error("Failed to update vendor");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "VENDOR",
    entityId: vendor.id,
    oldValue: existingVendor,
    newValue: vendor,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return vendor;
}

export async function deleteVendor(
  organizationId: string,
  vendorId: string,
  auditInfo: AuditInfo,
) {
  const existingVendor = await db.query.vendors.findFirst({
    where: and(
      eq(vendors.id, vendorId),
      eq(vendors.organizationId, organizationId),
    ),
  });

  if (!existingVendor) {
    throw new Error("Vendor not found");
  }

  if (existingVendor.status === "INACTIVE") {
    throw new Error("Vendor is already inactive");
  }

  const [vendor] = await db
    .update(vendors)
    .set({
      status: "INACTIVE",
      updatedAt: new Date(),
    })
    .where(
      and(eq(vendors.id, vendorId), eq(vendors.organizationId, organizationId)),
    )
    .returning();

  if (!vendor) {
    throw new Error("Failed to deactivate vendor");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "DELETE",
    entityType: "VENDOR",
    entityId: vendorId,
    oldValue: existingVendor,
    newValue: null,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return vendor;
}
