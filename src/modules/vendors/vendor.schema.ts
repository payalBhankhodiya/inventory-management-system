import { z } from "zod";

export const vendorStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const vendorAddressSchema = z.object({
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().min(1),
});

export const createVendorSchema = z.object({
  organizationId: z.uuid(),

  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50),
  contactPerson: z.string().max(150).optional(),
  email: z.email().optional(),
  phone: z.string().max(30).optional(),
  address: vendorAddressSchema.optional(),
  taxNumber: z.string().max(100).optional(),

  status: vendorStatusSchema.default("ACTIVE"),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;

export const updateVendorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(50).optional(),
  contactPerson: z.string().max(150).optional(),
  email: z.email().optional(),
  phone: z.string().max(30).optional(),
  address: vendorAddressSchema.nullable().optional(),
  taxNumber: z.string().max(100).optional(),
  status: vendorStatusSchema.optional(),
});

export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;

export const vendorIdParamSchema = z.object({
  id: z.uuid(),
});

export const vendorsListQuerySchema = z.object({
  search: z.string().optional(),
  status: vendorStatusSchema.optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type VendorsListQuery = z.infer<typeof vendorsListQuerySchema>;

export const vendorResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),

  name: z.string(),
  code: z.string(),
  contactPerson: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: vendorAddressSchema.nullable(),
  taxNumber: z.string().nullable(),

  status: vendorStatusSchema,

  createdAt: z.date(),
  updatedAt: z.date(),
});

export const vendorSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: vendorResponseSchema,
});

export const vendorsListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(vendorResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const deleteVendorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const vendorErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});