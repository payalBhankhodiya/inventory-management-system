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
import { assets } from "../../db/schema/asset.js";
import { users } from "../../db/schema/user.js";

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
  organizationId: string,
  input: CreateAssignmentInput,
  auditInfo: AuditInfo,
) {
  const assignment = await db.transaction(async (tx) => {
    const [asset] = await tx
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.id, input.assetId),
          eq(assets.organizationId, organizationId),
        ),
      )
      .for("update");

    if (!asset) {
      throw new Error("Asset not found");
    }

    if (asset.status !== "AVAILABLE") {
      throw new Error("Asset is not available for assignment");
    }

    const [user] = await tx
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, input.assignedToUserId),
          eq(users.organizationId, organizationId),
        ),
      );

    if (!user) {
      throw new Error("Assigned user not found in this organization");
    }

    const now = new Date();

    const [created] = await tx
      .insert(assignments)
      .values({
        organizationId,
        assetId: asset.id,
        assignedToUserId: user.id,
        assignedByUserId: auditInfo.userId,
        departmentId: input.departmentId ?? null,
        siteId: input.siteId ?? null,
        assignedAt: now,
        expectedReturnDate: input.expectedReturnDate
          ? new Date(input.expectedReturnDate)
          : null,
        conditionAtAssignment:
          input.conditionAtAssignment ?? asset.condition,
        remarks: input.remarks ?? null,
        status: "ASSIGNED",
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create assignment");
    }

    await tx
      .update(assets)
      .set({
        status: "ASSIGNED",
        updatedAt: now,
      })
      .where(eq(assets.id, asset.id));

    return created;
  });

  await createAuditLog({
    organizationId,
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
