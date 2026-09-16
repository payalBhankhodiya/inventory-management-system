import { z } from "zod";

export const siteStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
]);

export const siteAddressSchema = z.object({
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().min(1),
});

export const createSiteSchema = z.object({
  name: z.string().min(1).max(150),

  code: z.string().min(1).max(50),

  isMain: z.boolean().default(false),

  address: siteAddressSchema.optional(),

  managerId: z.uuid().optional(),

  organizationId: z.uuid(),

  status: siteStatusSchema.default("ACTIVE"),
});

export type CreateSiteInput = z.infer<
  typeof createSiteSchema
>;

export const updateSiteSchema = z.object({
  name: z.string().min(1).max(150).optional(),

  code: z.string().min(1).max(50).optional(),

  isMain: z.boolean().optional(),

  address: siteAddressSchema.optional(),

  managerId: z.uuid().nullable().optional(),

  status: siteStatusSchema.optional(),
});

export type UpdateSiteInput = z.infer<
  typeof updateSiteSchema
>;

export const siteIdParamSchema = z.object({
  id: z.uuid(),
});

export const sitesListQuerySchema = z.object({
  search: z.string().optional(),

  status: siteStatusSchema.optional(),

  isMain: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type SitesListQuery = z.infer<
  typeof sitesListQuerySchema
>;

export const siteResponseSchema = z.object({
  id: z.uuid(),

  organizationId: z.uuid(),

  name: z.string(),

  code: z.string(),

  isMain: z.boolean(),

  address: siteAddressSchema.nullable(),

  managerId: z.uuid().nullable(),

  status: siteStatusSchema,

  createdAt: z.date(),

  updatedAt: z.date(),
});

export const siteSingleResponseSchema = z.object({
  success: z.boolean(),

  message: z.string(),

  data: siteResponseSchema,
});

export const sitesListResponseSchema = z.object({
  success: z.boolean(),

  message: z.string(),

  data: z.array(siteResponseSchema),

  pagination: z.object({
    page: z.number(),

    limit: z.number(),

    total: z.number(),

    totalPages: z.number(),
  }),
});

export const siteDeleteResponseSchema = z.object({
  success: z.boolean(),

  message: z.string(),
});