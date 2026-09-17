import { z } from "zod";

export const assignmentStatusSchema = z.enum([
  "ASSIGNED",
  "RETURNED",
  "CANCELLED",
]);

export const assetConditionSchema = z.enum([
  "NEW",
  "GOOD",
  "FAIR",
  "DAMAGED",
]);

export const createAssignmentSchema = z.object({
  organizationId: z.uuid(),

  assetId: z.uuid(),
  assignedToUserId: z.uuid(),
  assignedByUserId: z.uuid(),

  departmentId: z.uuid().optional(),
  siteId: z.uuid().optional(),

  assignedAt: z.iso.datetime(),
  expectedReturnDate: z.iso.datetime().optional(),

  conditionAtAssignment: assetConditionSchema.optional(),

  remarks: z.string().max(1000).optional(),

  status: assignmentStatusSchema.default("ASSIGNED"),
});

export type CreateAssignmentInput = z.infer<
  typeof createAssignmentSchema
>;

export const updateAssignmentSchema = z.object({
  assignedToUserId: z.uuid().optional(),
  departmentId: z.uuid().nullable().optional(),
  siteId: z.uuid().nullable().optional(),

  expectedReturnDate: z.iso.datetime().nullable().optional(),

  returnedAt: z.iso.datetime().nullable().optional(),

  conditionAtAssignment: assetConditionSchema.nullable().optional(),
  conditionAtReturn: assetConditionSchema.nullable().optional(),

  remarks: z.string().max(1000).nullable().optional(),

  status: assignmentStatusSchema.optional(),
});

export type UpdateAssignmentInput = z.infer<
  typeof updateAssignmentSchema
>;

export const assignmentIdParamSchema = z.object({
  id: z.uuid(),
});

export const assignmentsListQuerySchema = z.object({
  search: z.string().optional(),

  status: assignmentStatusSchema.optional(),
  assetId: z.uuid().optional(),
  assignedToUserId: z.uuid().optional(),
  assignedByUserId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  siteId: z.uuid().optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type AssignmentsListQuery = z.infer<
  typeof assignmentsListQuerySchema
>;

export const assignmentResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),

  assetId: z.uuid(),
  assignedToUserId: z.uuid(),
  assignedByUserId: z.uuid(),

  departmentId: z.uuid().nullable(),
  siteId: z.uuid().nullable(),

  assignedAt: z.date(),
  expectedReturnDate: z.date().nullable(),
  returnedAt: z.date().nullable(),

  conditionAtAssignment: assetConditionSchema.nullable(),
  conditionAtReturn: assetConditionSchema.nullable(),

  remarks: z.string().nullable(),

  status: assignmentStatusSchema,

  createdAt: z.date(),
  updatedAt: z.date(),
});

export const assignmentSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: assignmentResponseSchema,
});

export const assignmentsListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(assignmentResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const deleteAssignmentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const assignmentErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});