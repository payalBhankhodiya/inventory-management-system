import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { assignments } from "../../db/schema/assignment.js";

import type {
  AssignmentsListQuery,
  CreateAssignmentInput,
  ReturnAssignmentInput,
  UpdateAssignmentInput,
} from "./assignment.schema.js";
import { AuditInfo } from "../../types/audit.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";
import { assets } from "../../db/schema/asset.js";
import { users } from "../../db/schema/user.js";
import { sites } from "../../db/schema/site.js";
import { departments } from "../../db/schema/department.js";

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

    let assignmentSiteId = input.siteId ?? null;

    if (input.departmentId) {
      const [department] = await tx
        .select()
        .from(departments)
        .where(
          and(
            eq(departments.id, input.departmentId),
            eq(departments.organizationId, organizationId),
            eq(departments.status, "ACTIVE"),
          ),
        );

      if (!department) {
        throw new Error("Active department not found in this organization");
      }

      if (assignmentSiteId && department.siteId !== assignmentSiteId) {
        throw new Error("Department does not belong to the selected site");
      }

      assignmentSiteId = department.siteId;
    }

    if (assignmentSiteId) {
      const [site] = await tx
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.id, assignmentSiteId),
            eq(sites.organizationId, organizationId),
            eq(sites.status, "ACTIVE"),
          ),
        );

      if (!site) {
        throw new Error("Active site not found in this organization");
      }
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
        siteId: assignmentSiteId,
        assignedAt: now,
        expectedReturnDate: input.expectedReturnDate
          ? new Date(input.expectedReturnDate)
          : null,
        conditionAtAssignment: input.conditionAtAssignment ?? asset.condition,
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
      departmentId: input.departmentId,
      siteId: input.siteId,

      expectedReturnDate:
        input.expectedReturnDate !== undefined
          ? input.expectedReturnDate === null
            ? null
            : new Date(input.expectedReturnDate)
          : undefined,

      conditionAtAssignment: input.conditionAtAssignment,
      remarks: input.remarks,

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
  const result = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(assignments)
      .where(
        and(
          eq(assignments.id, assignmentId),
          eq(assignments.organizationId, organizationId),
        ),
      )
      .for("update");

    if (!existing) {
      throw new Error("Assignment not found");
    }

    if (existing.status !== "ASSIGNED") {
      throw new Error("Only active assignments can be cancelled");
    }

    const now = new Date();

    const [cancelled] = await tx
      .update(assignments)
      .set({
        status: "CANCELLED",
        updatedAt: now,
      })
      .where(eq(assignments.id, assignmentId))
      .returning();

    if (!cancelled) {
      throw new Error("Failed to cancel assignment");
    }

    await tx
      .update(assets)
      .set({
        status: "AVAILABLE",
        updatedAt: now,
      })
      .where(
        and(
          eq(assets.id, existing.assetId),
          eq(assets.organizationId, organizationId),
          eq(assets.status, "ASSIGNED"),
        ),
      );

    return {
      oldValue: existing,
      assignment: cancelled,
    };
  });

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "DELETE",
    entityType: "ASSIGNMENT",
    entityId: result.assignment.id,
    oldValue: result.oldValue,
    newValue: result.assignment,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return result.assignment;
}

export async function returnAssignment(
  organizationId: string,
  assignmentId: string,
  input: ReturnAssignmentInput,
  auditInfo: AuditInfo,
) {
  const result = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(assignments)
      .where(
        and(
          eq(assignments.id, assignmentId),
          eq(assignments.organizationId, organizationId),
        ),
      )
      .for("update");

    if (!existing) {
      throw new Error("Assignment not found");
    }

    if (existing.status !== "ASSIGNED") {
      throw new Error("Only active assignments can be returned");
    }

    const [asset] = await tx
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.id, existing.assetId),
          eq(assets.organizationId, organizationId),
        ),
      )
      .for("update");

    if (!asset) {
      throw new Error("Asset not found");
    }

    const now = new Date();

    const [updated] = await tx
      .update(assignments)
      .set({
        status: "RETURNED",
        returnedAt: now,
        conditionAtReturn: input.conditionAtReturn,
        remarks: input.remarks ?? existing.remarks,
        updatedAt: now,
      })
      .where(eq(assignments.id, assignmentId))
      .returning();

    if (!updated) {
      throw new Error("Failed to return assignment");
    }

    const assetStatus =
      input.conditionAtReturn === "DAMAGED" ? "DAMAGED" : "AVAILABLE";

    await tx
      .update(assets)
      .set({
        condition: input.conditionAtReturn,
        status: assetStatus,
        updatedAt: now,
      })
      .where(eq(assets.id, asset.id));

    return {
      oldValue: existing,
      assignment: updated,
    };
  });

  await createAuditLog({
    organizationId,
    userId: auditInfo.userId,
    action: "UPDATE",
    entityType: "ASSIGNMENT",
    entityId: result.assignment.id,
    oldValue: result.oldValue,
    newValue: result.assignment,
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return result.assignment;
}
