// import { z } from "zod";

// export const loginSchema = z.object({
//   email: z.email(),
//   password: z.string().min(1),
// });

// export type LoginInput = z.infer<typeof loginSchema>;

// export const registerSchema = z.object({
//   name: z.string().min(1).max(150),
//   email: z.email(),
//   password: z.string().min(8),
//   employeeCode: z.string().max(50).optional(),
//   organizationId: z.uuid(),
//   roleName: z.string().min(1).max(100),
//   departmentId: z.uuid().optional(),
//   siteId: z.uuid().optional(),
// });

// export type RegisterInput = z.infer<typeof registerSchema>;

// const userResponseSchema = z.object({
//   id: z.uuid(),
//   name: z.string(),
//   email: z.email(),
//   organizationId: z.uuid(),
//   roleId: z.uuid(),
//   roleName: z.string(),
//   departmentId: z.uuid().nullable(),
//   siteId: z.uuid().nullable(),
//   status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
// });

// export const registerResponseSchema = z.object({
//   success: z.boolean(),
//   message: z.string(),
//   data: userResponseSchema,
// });

// export const loginResponseSchema = z.object({
//   success: z.boolean(),
//   message: z.string(),
//   data: z.object({
//     accessToken: z.string(),
//     user: userResponseSchema,
//   }),
// });

// export const meResponseSchema = z.object({
//   success: z.boolean(),
//   data: z.object({
//     userId: z.string(),
//     organizationId: z.string(),
//     roleId: z.string(),
//     roleName: z.string(),
//   }),
// });

import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(150),

  email: z.email().max(255),

  password: z.string().min(8).max(100),

  organizationId: z.uuid(),

  employeeCode: z.string().max(50).nullable().optional(),

  roleId: z.uuid(),

  departmentId: z.uuid().nullable().optional(),

  siteId: z.uuid().nullable().optional(),
});

export const registerResponseSchema = z.object({
  success: z.boolean(),

  message: z.string(),

  data: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    organizationId: z.uuid(),
    employeeCode: z.string().nullable(),
    roleId: z.uuid(),
    departmentId: z.uuid().nullable(),
    siteId: z.uuid().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
    emailVerified: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

export const errorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const verifyEmailResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const loginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(100),
});

export const loginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: z.object({
      id: z.uuid(),
      name: z.string(),
      email: z.email(),
      organizationId: z.uuid(),
      roleId: z.uuid(),
      status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
      emailVerified: z.boolean(),
    }),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const refreshTokenResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
});

export const changePasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email().max(255),
});

export const forgotPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export const resetPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type ResetPasswordInput = z.infer<
  typeof resetPasswordSchema
>;