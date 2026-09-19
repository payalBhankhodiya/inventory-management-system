import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { assignments } from "../../db/schema/assignment.js";

import type {
  AssignmentsListQuery,
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from "./assignment.schema.js";
import { AuditInfo } from "../../types/audit.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";

export async function getAssignments(
  organizationId: string,
  query: AssignmentsListQuery,
) {
  const conditions = [eq(assignments.organizationId, organizationId)];

  if (query.search) {
    conditions.push(or(ilike(assignments.remarks, `%${query.search}%`))!);
  }

  if (query.status) {
    conditions.push(eq(assignments.status, query.status));
  }

  if (query.assetId) {
    conditions.push(eq(assignments.assetId, query.assetId));
  }

  if (query.assignedToUserId) {
    conditions.push(eq(assignments.assignedToUserId, query.assignedToUserId));
  }

  if (query.assignedByUserId) {
    conditions.push(eq(assignments.assignedByUserId, query.assignedByUserId));
  }

  if (query.departmentId) {
    conditions.push(eq(assignments.departmentId, query.departmentId));
  }

  if (query.siteId) {
    conditions.push(eq(assignments.siteId, query.siteId));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(assignments)
    .where(and(...conditions))
    .orderBy(desc(assignments.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(assignments)
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

export async function getAssignmentById(
  organizationId: string,
  assignmentId: string,
) {
  const assignment = await db.query.assignments.findFirst({
    where: and(
      eq(assignments.id, assignmentId),
      eq(assignments.organizationId, organizationId),
    ),
  });

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  return assignment;
}

export async function createAssignment(
  input: CreateAssignmentInput,
  auditInfo: AuditInfo,
) {
  const existingAssignment = await db.query.assignments.findFirst({
    where: and(
      eq(assignments.organizationId, input.organizationId),
      eq(assignments.assetId, input.assetId),
      eq(assignments.status, "ASSIGNED"),
    ),
  });

  if (existingAssignment) {
    throw new Error("Asset is already assigned");
  }

  const [assignment] = await db
    .insert(assignments)
    .values({
      organizationId: input.organizationId,

      assetId: input.assetId,
      assignedToUserId: input.assignedToUserId,
      assignedByUserId: input.assignedByUserId,

      departmentId: input.departmentId,
      siteId: input.siteId,

      assignedAt: new Date(input.assignedAt),
      expectedReturnDate: input.expectedReturnDate
        ? new Date(input.expectedReturnDate)
        : undefined,

      conditionAtAssignment: input.conditionAtAssignment,

      remarks: input.remarks,

      status: input.status,
    })
    .returning();

  if (!assignment) {
    throw new Error("Failed to create assignment");
  }

  await createAuditLog({
    organizationId: assignment.organizationId,
    userId: auditInfo.userId,
    action: "CREATE",
    entityType: "ASSIGNMENT",
    entityId: assignment.id,
    oldValue: null,
    newValue: assignment,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return assignment;
}

export async function updateAssignment(
  organizationId: string,
  assignmentId: string,
  input: UpdateAssignmentInput,
  auditInfo: AuditInfo,
) {
  const existingAssignment = await db.query.assignments.findFirst({
    where: and(
      eq(assignments.id, assignmentId),
      eq(assignments.organizationId, organizationId),
    ),
  });

  if (!existingAssignment) {
    throw new Error("Assignment not found");
  }

  const [assignment] = await db
    .update(assignments)
    .set({
      assignedToUserId: input.assignedToUserId,

      departmentId: input.departmentId,

      siteId: input.siteId,

      expectedReturnDate:
        input.expectedReturnDate !== undefined
          ? input.expectedReturnDate === null
            ? null
            : new Date(input.expectedReturnDate)
          : undefined,

      returnedAt:
        input.returnedAt !== undefined
          ? input.returnedAt === null
            ? null
            : new Date(input.returnedAt)
          : undefined,

      conditionAtAssignment: input.conditionAtAssignment,

      conditionAtReturn: input.conditionAtReturn,

      remarks: input.remarks,

      status: input.status,

      updatedAt: new Date(),
    })
    .where(
      and(
        eq(assignments.id, assignmentId),
        eq(assignments.organizationId, organizationId),
      ),
    )
    .returning();

  if (!assignment) {
    throw new Error("Failed to update assignment");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "ASSIGNMENT",
    entityId: assignment.id,
    oldValue: existingAssignment,
    newValue: assignment,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return assignment;
}

export async function deleteAssignment(
  organizationId: string,
  assignmentId: string,
  auditInfo: AuditInfo,
) {
  const existingAssignment = await db.query.assignments.findFirst({
    where: and(
      eq(assignments.id, assignmentId),
      eq(assignments.organizationId, organizationId),
    ),
  });

  if (!existingAssignment) {
    throw new Error("Assignment not found");
  }

  if (existingAssignment.status === "CANCELLED") {
    throw new Error("Assignment is already cancelled");
  }

  const [assignment] = await db
    .update(assignments)
    .set({
      status: "CANCELLED",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(assignments.id, assignmentId),
        eq(assignments.organizationId, organizationId),
      ),
    )
    .returning();

  if (!assignment) {
    throw new Error("Failed to cancel assignment");
  }

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "DELETE",
    entityType: "ASSIGNMENT",
    entityId: assignmentId,
    oldValue: existingAssignment,
    newValue: null,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return assignment;
}
