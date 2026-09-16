import { z } from "zod";

export const userStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
]);

export const createUserSchema = z.object({
  name: z.string().min(1).max(150),

  email: z.email(),

  password: z.string().min(8).max(100),

  employeeCode: z.string().max(50).optional(),

  organizationId: z.uuid(),

  roleId: z.uuid(),

  departmentId: z.uuid().optional(),

  siteId: z.uuid().optional(),

  status: userStatusSchema.default("ACTIVE"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1).max(150).optional(),

  email: z.email().optional(),

  employeeCode: z.string().max(50).optional(),

  roleId: z.uuid().optional(),

  departmentId: z.uuid().optional(),

  siteId: z.uuid().optional(),

  status: userStatusSchema.optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const userIdParamSchema = z.object({
  id: z.uuid(),
});

export const usersListQuerySchema = z.object({
  search: z.string().optional(),

  status: userStatusSchema.optional(),

  roleId: z.uuid().optional(),

  departmentId: z.uuid().optional(),

  siteId: z.uuid().optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type UsersListQuery = z.infer<
  typeof usersListQuerySchema
>;

export const userResponseSchema = z.object({
  id: z.uuid(),

  name: z.string(),

  email: z.email(),

  employeeCode: z.string().nullable(),

  organizationId: z.uuid(),

  roleId: z.uuid(),

  departmentId: z.uuid().nullable(),

  siteId: z.uuid().nullable(),

  status: userStatusSchema,

  lastLoginAt: z.date().nullable(),

  createdAt: z.date(),

  updatedAt: z.date(),
});

export const userSingleResponseSchema = z.object({
  success: z.boolean(),

  message: z.string(),

  data: userResponseSchema,
});

export const usersListResponseSchema = z.object({
  success: z.boolean(),

  message: z.string(),

  data: z.array(userResponseSchema),

  pagination: z.object({
    page: z.number(),

    limit: z.number(),

    total: z.number(),

    totalPages: z.number(),
  }),
});

export const deleteUserResponseSchema = z.object({
  success: z.boolean(),

  message: z.string(),
});