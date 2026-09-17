import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1).max(150),
  email: z.email(),
  password: z.string().min(8),
  employeeCode: z.string().max(50).optional(),
  organizationId: z.uuid(),
  roleName: z.string().min(1).max(100),
  departmentId: z.uuid().optional(),
  siteId: z.uuid().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

const userResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  organizationId: z.uuid(),
  roleId: z.uuid(),
  roleName: z.string(),
  departmentId: z.uuid().nullable(),
  siteId: z.uuid().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export const registerResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: userResponseSchema,
});

export const loginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    accessToken: z.string(),
    user: userResponseSchema,
  }),
});

export const meResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    userId: z.string(),
    organizationId: z.string(),
    roleId: z.string(),
    roleName: z.string(),
  }),
});
