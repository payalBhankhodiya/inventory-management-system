import { z } from "zod";

export const organizationStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const organizationAddressSchema = z.object({
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().min(1),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(50),

  email: z.email().optional(),
  phone: z.string().max(30).optional(),

  address: organizationAddressSchema.optional(),

  status: organizationStatusSchema.default("ACTIVE"),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  code: z.string().min(1).max(50).optional(),

  email: z.email().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),

  address: organizationAddressSchema.nullable().optional(),

  status: organizationStatusSchema.optional(),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const organizationIdParamSchema = z.object({
  id: z.uuid(),
});

export const organizationListQuerySchema = z.object({
  search: z.string().optional(),
  status: organizationStatusSchema.optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type OrganizationListQuery = z.infer<typeof organizationListQuerySchema>;

export const organizationResponseSchema = z.object({
  id: z.uuid(),

  name: z.string(),
  code: z.string(),

  email: z.string().nullable(),
  phone: z.string().nullable(),

  address: z.unknown().nullable(),

  status: organizationStatusSchema,

  createdAt: z.date(),
  updatedAt: z.date(),
});

export const organizationSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: organizationResponseSchema,
});

export const organizationListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(organizationResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const organizationDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const organizationErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
