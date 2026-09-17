import { z } from "zod";

export const createPermissionSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional(),

  module: z.string().min(1).max(100),
  action: z.string().min(1).max(100),
});

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;

export const updatePermissionSchema = z.object({
  name: z.string().min(1).max(150).optional(),

  description: z.string().max(500).nullable().optional(),

  module: z.string().min(1).max(100).optional(),
  action: z.string().min(1).max(100).optional(),
});

export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;

export const permissionIdParamSchema = z.object({
  id: z.uuid(),
});

export const permissionListQuerySchema = z.object({
  search: z.string().optional(),
  module: z.string().optional(),
  action: z.string().optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type PermissionListQuery = z.infer<typeof permissionListQuerySchema>;

export const permissionResponseSchema = z.object({
  id: z.uuid(),

  name: z.string(),
  description: z.string().nullable(),

  module: z.string(),
  action: z.string(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export const permissionSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: permissionResponseSchema,
});

export const permissionListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(permissionResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const permissionDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const permissionErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
