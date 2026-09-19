import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { departments } from "../../db/schema/department.js";
import type {
  CreateDepartmentInput,
  DepartmentsListQuery,
  UpdateDepartmentInput,
} from "./department.schema.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";
import { AuditInfo } from "../../types/audit.js";

export async function getDepartments(
  organizationId: string,
  query: DepartmentsListQuery,
) {
  const conditions = [eq(departments.organizationId, organizationId)];

  if (query.search) {
    conditions.push(
      or(
        ilike(departments.name, `%${query.search}%`),
        ilike(departments.code, `%${query.search}%`),
        ilike(departments.description, `%${query.search}%`),
      )!,
    );
  }

  if (query.status) {
    conditions.push(eq(departments.status, query.status));
  }

  if (query.siteId) {
    conditions.push(eq(departments.siteId, query.siteId));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(departments)
    .where(and(...conditions))
    .orderBy(desc(departments.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(departments)
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

export async function getDepartmentById(
  organizationId: string,
  departmentId: string,
) {
  const department = await db.query.departments.findFirst({
    where: and(
      eq(departments.id, departmentId),
      eq(departments.organizationId, organizationId),
    ),
  });

  if (!department) {
    throw new Error("Department not found");
  }

  return department;
}

export async function createDepartment(
  input: CreateDepartmentInput,
  auditInfo: AuditInfo,
) {
  const existingDepartment = await db.query.departments.findFirst({
    where: and(
      eq(departments.organizationId, input.organizationId),
      eq(departments.code, input.code),
    ),
  });

  if (existingDepartment) {
    throw new Error("Department with this code already exists");
  }

  const [department] = await db
    .insert(departments)
    .values({
      organizationId: input.organizationId,
      siteId: input.siteId,
      name: input.name,
      code: input.code,
      description: input.description,
      managerId: input.managerId,
      status: input.status,
    })
    .returning();

  if (!department) {
    throw new Error("Failed to create department");
  }

  await createAuditLog({
    organizationId: department.organizationId,
    userId: auditInfo.userId,
    action: "CREATE",
    entityType: "DEPARTMENT",
    entityId: department.id,
    oldValue: null,
    newValue: department,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return department;
}

export async function updateDepartment(
  organizationId: string,
  departmentId: string,
  input: UpdateDepartmentInput,
  auditInfo: AuditInfo,
) {
  const existingDepartment = await db.query.departments.findFirst({
    where: and(
      eq(departments.id, departmentId),
      eq(departments.organizationId, organizationId),
    ),
  });

  if (!existingDepartment) {
    throw new Error("Department not found");
  }

  if (input.code && input.code !== existingDepartment.code) {
    const duplicateDepartment = await db.query.departments.findFirst({
      where: and(
        eq(departments.organizationId, organizationId),
        eq(departments.code, input.code),
      ),
    });

    if (duplicateDepartment) {
      throw new Error("Department with this code already exists");
    }
  }

  const [department] = await db
    .update(departments)
    .set({
      name: input.name,
      code: input.code,
      description: input.description,
      siteId: input.siteId,
      managerId: input.managerId,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(departments.id, departmentId),
        eq(departments.organizationId, organizationId),
      ),
    )
    .returning();

  if (!department) {
    throw new Error("Failed to update department");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "DEPARTMENT",
    entityId: department.id,
    oldValue: existingDepartment,
    newValue: department,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return department;
}

export async function deleteDepartment(
  organizationId: string,
  departmentId: string,
  auditInfo: AuditInfo,
) {
  const existingDepartment = await db.query.departments.findFirst({
    where: and(
      eq(departments.id, departmentId),
      eq(departments.organizationId, organizationId),
    ),
  });

  if (!existingDepartment) {
    throw new Error("Department not found");
  }

  if (existingDepartment.status === "INACTIVE") {
    throw new Error("Department is already inactive");
  }

  const [department] = await db
    .update(departments)
    .set({
      status: "INACTIVE",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(departments.id, departmentId),
        eq(departments.organizationId, organizationId),
      ),
    )
    .returning();

  if (!department) {
    throw new Error("Failed to deactivate department");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "DELETE",
    entityType: "DEPARTMENT",
    entityId: department.id,
    oldValue: existingDepartment,
    newValue: department,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return department;
}
