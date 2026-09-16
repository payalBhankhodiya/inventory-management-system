import { z } from "zod";

export const roleStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
]);

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),

  description: z.string().max(500).optional(),

  organizationId: z.uuid(),

  isSystemRole: z.boolean().default(false),

  status: roleStatusSchema.default("ACTIVE"),
});

export type CreateRoleInput = z.infer<
  typeof createRoleSchema
>;

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),

  description: z.string().max(500).optional(),

  status: roleStatusSchema.optional(),
});

export type UpdateRoleInput = z.infer<
  typeof updateRoleSchema
>;

export const roleIdParamSchema = z.object({
  id: z.uuid(),
});

export const rolesListQuerySchema = z.object({
  search: z.string().optional(),

  status: roleStatusSchema.optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type RolesListQuery = z.infer<
  typeof rolesListQuerySchema
>;

export const permissionIdSchema = z.object({
  permissionId: z.uuid(),
});

export const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.uuid()).min(1),
});

export const permissionResponseSchema = z.object({
  id: z.uuid(),

  name: z.string(),

  module: z.string(),

  action: z.string(),
});

export const roleResponseSchema = z.object({
  id: z.uuid(),

  organizationId: z.uuid(),

  name: z.string(),

  description: z.string().nullable(),

  isSystemRole: z.boolean(),

  status: roleStatusSchema,

  createdAt: z.date(),

  updatedAt: z.date(),
});

export const roleSingleResponseSchema = z.object({
  success: z.boolean(),

  message: z.string(),

  data: roleResponseSchema,
});

export const rolesListResponseSchema = z.object({
  success: z.boolean(),

  message: z.string(),

  data: z.array(roleResponseSchema),

  pagination: z.object({
    page: z.number(),

    limit: z.number(),

    total: z.number(),

    totalPages: z.number(),
  }),
});

export const rolePermissionsResponseSchema = z.object({
  success: z.boolean(),

  message: z.string(),

  data: z.array(permissionResponseSchema),
});

export const roleDeleteResponseSchema = z.object({
  success: z.boolean(),

  message: z.string(),
});