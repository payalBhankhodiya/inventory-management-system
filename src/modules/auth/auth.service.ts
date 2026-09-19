// import bcrypt from "bcrypt";
// import { and, eq } from "drizzle-orm";

// import { db } from "../../db/index.js";
// import { users } from "../../db/schema/user.js";
// import { roles } from "../../db/schema/role.js";

// import type { LoginInput, RegisterInput } from "./auth.schema.js";

// export async function loginUser(input: LoginInput) {
//   const user = await db.query.users.findFirst({
//     where: eq(users.email, input.email),
//   });

//   if (!user) {
//     throw new Error("Invalid email or password");
//   }

//   if (user.status !== "ACTIVE") {
//     throw new Error("User account is not active");
//   }

//   const passwordValid = await bcrypt.compare(
//     input.password,
//     user.passwordHash,
//   );

//   if (!passwordValid) {
//     throw new Error("Invalid email or password");
//   }

//   const role = await db.query.roles.findFirst({
//     where: eq(roles.id, user.roleId),
//   });

//   if (!role) {
//     throw new Error("User role not found");
//   }

//   return {
//     ...user,
//     roleName: role.name,
//   };
// }

// export async function registerUser(input: RegisterInput) {
//   const existingUser = await db.query.users.findFirst({
//     where: eq(users.email, input.email),
//   });

//   if (existingUser) {
//     throw new Error("User with this email already exists");
//   }

//   // Verify role belongs to the organization
//   const role = await db.query.roles.findFirst({
//   where: and(
//     eq(roles.name, input.roleName),
//     eq(roles.organizationId, input.organizationId),
//   ),
// });

// if (!role) {
//   throw new Error("Role not found");
// }

//   // Verify role ID and role name match
//   if (role.name !== input.roleName) {
//     throw new Error("Role ID and role name do not match");
//   }

//   const passwordHash = await bcrypt.hash(
//     input.password,
//     10,
//   );

//   const [user] = await db
//     .insert(users)
//     .values({
//       name: input.name,
//       email: input.email,
//       passwordHash,
//       employeeCode: input.employeeCode,
//       organizationId: input.organizationId,
//       roleId: role.id,
//       departmentId: input.departmentId,
//       siteId: input.siteId,
//       status: "ACTIVE",
//     })
//     .returning();

//   if (!user) {
//     throw new Error("Failed to create user");
//   }

//   return {
//     ...user,
//     roleName: role.name,
//   };
// }

import { and, eq, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";
import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";

import { db } from "../../db/index.js";
import { users } from "../../db/schema/user.js";
import { roles } from "../../db/schema/role.js";
import { createAuditLog } from "../audit-logs/audit-log.service.js";

import type { AuditInfo } from "../../types/audit.js";

import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./auth.schema.js";
import { refreshTokens } from "../../db/schema/refresh-token.js";
import { passwordResetTokens } from "../../db/schema/password-reset-token.js";

export async function registerUser(input: RegisterInput, auditInfo: AuditInfo) {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const emailVerificationToken = crypto.randomBytes(32).toString("hex");

  const emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [user] = await db
    .insert(users)
    .values({
      organizationId: input.organizationId,
      name: input.name,
      email: input.email,
      passwordHash,

      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpiresAt,

      employeeCode: input.employeeCode ?? null,
      roleId: input.roleId,
      departmentId: input.departmentId ?? null,
      siteId: input.siteId ?? null,

      status: "ACTIVE",
    })
    .returning();

  if (!user) {
    throw new Error("Failed to register user");
  }

  await createAuditLog({
    organizationId: user.organizationId,
    userId: auditInfo.userId,
    action: "REGISTER",
    entityType: "USER",
    entityId: user.id,
    oldValue: null,
    newValue: {
      id: user.id,
      name: user.name,
      email: user.email,
      organizationId: user.organizationId,
      roleId: user.roleId,
      departmentId: user.departmentId,
      siteId: user.siteId,
      status: user.status,
      emailVerified: user.emailVerified,
    },
    ipAddress: auditInfo.ipAddress ?? null,
    userAgent: auditInfo.userAgent ?? null,
  });

  return user;
}

export async function verifyEmail(token: string, auditInfo?: AuditInfo) {
  const user = await db.query.users.findFirst({
    where: eq(users.emailVerificationToken, token),
  });

  if (!user) {
    throw new Error("Invalid or expired verification token");
  }

  if (
    !user.emailVerificationExpiresAt ||
    user.emailVerificationExpiresAt < new Date()
  ) {
    throw new Error("Invalid or expired verification token");
  }

  if (user.emailVerified) {
    throw new Error("Email is already verified");
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  if (!updatedUser) {
    throw new Error("Failed to verify email");
  }

  await createAuditLog({
    organizationId: updatedUser.organizationId,
    userId: auditInfo?.userId ?? null,
    action: "EMAIL_VERIFIED",
    entityType: "USER",
    entityId: updatedUser.id,
    oldValue: {
      emailVerified: false,
    },
    newValue: {
      emailVerified: true,
    },
    ipAddress: auditInfo?.ipAddress ?? null,
    userAgent: auditInfo?.userAgent ?? null,
  });

  return updatedUser;
}

export async function loginUser(input: LoginInput, app: FastifyInstance) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("User account is not active");
  }

  if (!user.emailVerified) {
    throw new Error("Please verify your email before logging in");
  }

  const role = await db.query.roles.findFirst({
    where: eq(roles.id, user.roleId),
  });

  if (!role) {
    throw new Error("User role not found");
  }

  const accessToken = await app.jwt.sign({
    userId: user.id,
    organizationId: user.organizationId,
    roleId: user.roleId,
    roleName: role.name,
  });

  const refreshToken = crypto.randomBytes(64).toString("hex");
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt: refreshTokenExpiresAt,
  });

  const [updatedUser] = await db
    .update(users)
    .set({
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  if (!updatedUser) {
    throw new Error("Failed to update login information");
  }

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "LOGIN",
    entityType: "USER",
    entityId: user.id,
    oldValue: null,
    newValue: {
      lastLoginAt: updatedUser.lastLoginAt,
    },
    ipAddress: null,
    userAgent: null,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      organizationId: user.organizationId,
      roleId: user.roleId,
      status: user.status,
      emailVerified: user.emailVerified,
    },
  };
}

export async function refreshAccessToken(
  refreshToken: string,
  app: FastifyInstance,
) {
  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const storedToken = await db.query.refreshTokens.findFirst({
    where: and(
      eq(refreshTokens.tokenHash, tokenHash),
      isNull(refreshTokens.revokedAt),
    ),
  });

  if (!storedToken) {
    throw new Error("Invalid refresh token");
  }

  if (storedToken.expiresAt < new Date()) {
    throw new Error("Refresh token has expired");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, storedToken.userId),
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("User account is not active");
  }

  const role = await db.query.roles.findFirst({
    where: eq(roles.id, user.roleId),
  });

  if (!role) {
    throw new Error("User role not found");
  }

  const accessToken = await app.jwt.sign({
    userId: user.id,
    organizationId: user.organizationId,
    roleId: user.roleId,
    roleName: role.name,
  });

  const newRefreshToken = crypto.randomBytes(64).toString("hex");

  const newRefreshTokenHash = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");

  const newRefreshTokenExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  );

  await db.transaction(async (tx) => {
    await tx
      .update(refreshTokens)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(refreshTokens.id, storedToken.id));

    await tx.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: newRefreshTokenHash,
      expiresAt: newRefreshTokenExpiresAt,
    });
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(refreshToken: string, userId: string) {
  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const storedToken = await db.query.refreshTokens.findFirst({
    where: and(
      eq(refreshTokens.tokenHash, tokenHash),
      eq(refreshTokens.userId, userId),
      isNull(refreshTokens.revokedAt),
    ),
  });

  if (!storedToken) {
    throw new Error("Invalid refresh token");
  }

  const [revokedToken] = await db
    .update(refreshTokens)
    .set({
      revokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(refreshTokens.id, storedToken.id))
    .returning();

  if (!revokedToken) {
    throw new Error("Failed to logout");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (user) {
    await createAuditLog({
      organizationId: user.organizationId,
      userId,
      action: "LOGOUT",
      entityType: "USER",
      entityId: userId,
      oldValue: {
        refreshTokenActive: true,
      },
      newValue: {
        refreshTokenActive: false,
      },
      ipAddress: null,
      userAgent: null,
    });
  }
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error("User not found");
  }

  const currentPasswordValid = await bcrypt.compare(
    input.currentPassword,
    user.passwordHash,
  );

  if (!currentPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  const samePassword = await bcrypt.compare(
    input.newPassword,
    user.passwordHash,
  );

  if (samePassword) {
    throw new Error("New password must be different from current password");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);

  const [updatedUser] = await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  if (!updatedUser) {
    throw new Error("Failed to change password");
  }

  await db
    .update(refreshTokens)
    .set({
      revokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)),
    );

  await createAuditLog({
    organizationId: user.organizationId,
    userId,
    action: "PASSWORD_CHANGED",
    entityType: "USER",
    entityId: userId,
    oldValue: null,
    newValue: {
      passwordChanged: true,
    },
    ipAddress: null,
    userAgent: null,
  });
}

export async function forgotPassword(
  input: ForgotPasswordInput,
) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  // Same response whether the email exists or not.
  if (!user) {
    return;
  }

  const token = crypto.randomBytes(64).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + 30 * 60 * 1000,
  );

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  // Temporary development output.
  // Replace with email service later.
  console.log(
    `Password reset token for ${user.email}: ${token}`,
  );
}

export async function resetPassword(
  input: ResetPasswordInput,
) {
  const tokenHash = crypto
    .createHash("sha256")
    .update(input.token)
    .digest("hex");

  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      isNull(passwordResetTokens.usedAt),
    ),
  });

  if (!resetToken) {
    throw new Error("Invalid or expired reset token");
  }

  if (resetToken.expiresAt < new Date()) {
    throw new Error("Invalid or expired reset token");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, resetToken.userId),
  });

  if (!user) {
    throw new Error("User not found");
  }

  const passwordHash = await bcrypt.hash(
    input.newPassword,
    12,
  );

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await tx
      .update(passwordResetTokens)
      .set({
        usedAt: new Date(),
      })
      .where(eq(passwordResetTokens.id, resetToken.id));

    await tx
      .update(refreshTokens)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(refreshTokens.userId, user.id),
          isNull(refreshTokens.revokedAt),
        ),
      );
  });

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "PASSWORD_RESET",
    entityType: "USER",
    entityId: user.id,
    oldValue: null,
    newValue: {
      passwordReset: true,
    },
    ipAddress: null,
    userAgent: null,
  });
}