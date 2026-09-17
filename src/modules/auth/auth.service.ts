import bcrypt from "bcrypt";
import { and, eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { users } from "../../db/schema/user.js";
import { roles } from "../../db/schema/role.js";

import type { LoginInput, RegisterInput } from "./auth.schema.js";

export async function loginUser(input: LoginInput) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("User account is not active");
  }

  const passwordValid = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }

  const role = await db.query.roles.findFirst({
    where: eq(roles.id, user.roleId),
  });

  if (!role) {
    throw new Error("User role not found");
  }

  return {
    ...user,
    roleName: role.name,
  };
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Verify role belongs to the organization
  const role = await db.query.roles.findFirst({
  where: and(
    eq(roles.name, input.roleName),
    eq(roles.organizationId, input.organizationId),
  ),
});

if (!role) {
  throw new Error("Role not found");
}

  // Verify role ID and role name match
  if (role.name !== input.roleName) {
    throw new Error("Role ID and role name do not match");
  }

  const passwordHash = await bcrypt.hash(
    input.password,
    10,
  );

  const [user] = await db
    .insert(users)
    .values({
      name: input.name,
      email: input.email,
      passwordHash,
      employeeCode: input.employeeCode,
      organizationId: input.organizationId,
      roleId: role.id,
      departmentId: input.departmentId,
      siteId: input.siteId,
      status: "ACTIVE",
    })
    .returning();

  if (!user) {
    throw new Error("Failed to create user");
  }

  return {
    ...user,
    roleName: role.name,
  };
}