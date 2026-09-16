import bcrypt from "bcrypt";
import {
  and,
  desc,
  eq,
  ilike,
  or,
  sql,
} from "drizzle-orm";

import { db } from "../../db/index.js";
import { users } from "../../db/schema/user.js";

import type {
  CreateUserInput,
  UpdateUserInput,
  UsersListQuery,
} from "./user.schema.js";

export async function getUsers(
  organizationId: string,
  query: UsersListQuery,
) {
  const conditions = [
    eq(users.organizationId, organizationId),
  ];

  if (query.search) {
    conditions.push(
      or(
        ilike(users.name, `%${query.search}%`),
        ilike(users.email, `%${query.search}%`),
        ilike(
          users.employeeCode,
          `%${query.search}%`,
        ),
      )!,
    );
  }

  if (query.status) {
    conditions.push(
      eq(users.status, query.status),
    );
  }

  if (query.roleId) {
    conditions.push(
      eq(users.roleId, query.roleId),
    );
  }

  if (query.departmentId) {
    conditions.push(
      eq(users.departmentId, query.departmentId),
    );
  }

  if (query.siteId) {
    conditions.push(
      eq(users.siteId, query.siteId),
    );
  }

  const offset =
    (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(users)
    .where(and(...conditions))
    .orderBy(desc(users.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(users)
    .where(and(...conditions));

  const total = Number(
    countResult[0]?.count ?? 0,
  );

  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(
        total / query.limit,
      ),
    },
  };
}

export async function getUserById(
  organizationId: string,
  userId: string,
) {
  const user = await db.query.users.findFirst({
    where: and(
      eq(users.id, userId),
      eq(users.organizationId, organizationId),
    ),
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function createUser(
  input: CreateUserInput,
) {
  const existingUser =
    await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

  if (existingUser) {
    throw new Error(
      "User with this email already exists",
    );
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
      roleId: input.roleId,
      departmentId: input.departmentId,
      siteId: input.siteId,
      status: input.status,
    })
    .returning();

  if (!user) {
    throw new Error("Failed to create user");
  }

  return user;
}

export async function updateUser(
  organizationId: string,
  userId: string,
  input: UpdateUserInput,
) {
  const existingUser =
    await getUserById(
      organizationId,
      userId,
    );

  if (
    input.email &&
    input.email !== existingUser.email
  ) {
    const emailExists =
      await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

    if (emailExists) {
      throw new Error(
        "User with this email already exists",
      );
    }
  }

  const [user] = await db
    .update(users)
    .set({
      name: input.name,
      email: input.email,
      employeeCode: input.employeeCode,
      roleId: input.roleId,
      departmentId: input.departmentId,
      siteId: input.siteId,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(users.id, userId),
        eq(users.organizationId, organizationId),
      ),
    )
    .returning();

  if (!user) {
    throw new Error("Failed to update user");
  }

  return user;
}

export async function deleteUser(
  organizationId: string,
  userId: string,
) {
  const existingUser =
    await getUserById(
      organizationId,
      userId,
    );

  if (existingUser.status === "INACTIVE") {
    throw new Error(
      "User is already inactive",
    );
  }

  const [user] = await db
    .update(users)
    .set({
      status: "INACTIVE",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(users.id, userId),
        eq(users.organizationId, organizationId),
      ),
    )
    .returning();

  if (!user) {
    throw new Error(
      "Failed to deactivate user",
    );
  }

  return user;
}