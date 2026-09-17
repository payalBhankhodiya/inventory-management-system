import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { notifications } from "../../db/schema/notification.js";

import type {
  CreateNotificationInput,
  NotificationListQuery,
} from "./notification.schema.js";

export async function getNotifications(
  organizationId: string,
  userId: string,
  query: NotificationListQuery,
) {
  const conditions = [
    eq(notifications.organizationId, organizationId),
    eq(notifications.userId, userId),
  ];

  if (query.type) {
    conditions.push(eq(notifications.type, query.type));
  }

  if (query.entityType) {
    conditions.push(eq(notifications.entityType, query.entityType));
  }

  if (query.entityId) {
    conditions.push(eq(notifications.entityId, query.entityId));
  }

  if (query.isRead !== undefined) {
    conditions.push(eq(notifications.isRead, query.isRead));
  }

  const offset = (query.page - 1) * query.limit;

  const data = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(query.limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(notifications)
    .where(and(...conditions));

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getNotificationById(
  organizationId: string,
  userId: string,
  notificationId: string,
) {
  const notification = await db.query.notifications.findFirst({
    where: and(
      eq(notifications.id, notificationId),
      eq(notifications.organizationId, organizationId),
      eq(notifications.userId, userId),
    ),
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
}

export async function createNotification(input: CreateNotificationInput) {
  const [notification] = await db
    .insert(notifications)
    .values({
      organizationId: input.organizationId,

      userId: input.userId,

      type: input.type,

      title: input.title,
      message: input.message,

      entityType: input.entityType,
      entityId: input.entityId,
    })
    .returning();

  if (!notification) {
    throw new Error("Failed to create notification");
  }

  return notification;
}

export async function markNotificationAsRead(
  organizationId: string,
  userId: string,
  notificationId: string,
) {
  await getNotificationById(organizationId, userId, notificationId);

  const [notification] = await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.organizationId, organizationId),
        eq(notifications.userId, userId),
      ),
    )
    .returning();

  if (!notification) {
    throw new Error("Failed to mark notification as read");
  }

  return notification;
}

export async function markAllNotificationsAsRead(
  organizationId: string,
  userId: string,
) {
  await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(notifications.organizationId, organizationId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
      ),
    );

  return true;
}

export async function deleteNotification(
  organizationId: string,
  userId: string,
  notificationId: string,
) {
  await getNotificationById(organizationId, userId, notificationId);

  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.organizationId, organizationId),
        eq(notifications.userId, userId),
      ),
    );

  return true;
}
