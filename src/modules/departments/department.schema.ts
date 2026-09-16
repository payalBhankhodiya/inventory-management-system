import { z } from "zod";

export const departmentStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  organizationId: z.uuid(),
  siteId: z.uuid(),
  managerId: z.uuid().optional(),
  status: departmentStatusSchema.default("ACTIVE"),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  siteId: z.uuid().optional(),
  managerId: z.uuid().nullable().optional(),
  status: departmentStatusSchema.optional(),
});

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export const departmentIdParamSchema = z.object({
  id: z.uuid(),
});

export const departmentsListQuerySchema = z.object({
  search: z.string().optional(),
  status: departmentStatusSchema.optional(),
  siteId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type DepartmentsListQuery = z.infer<typeof departmentsListQuerySchema>;

export const departmentResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  siteId: z.uuid(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  managerId: z.uuid().nullable(),
  status: departmentStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const departmentSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: departmentResponseSchema,
});

export const departmentsListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(departmentResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const departmentDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const errorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
