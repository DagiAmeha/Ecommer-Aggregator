import { pool } from "../../config/db";

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_product_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationInput {
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_product_id?: number | null;
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<Notification> {
  const result = await pool.query<Notification>(
    `
      INSERT INTO notifications (
        user_id, type, title, message, related_product_id
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id, user_id, type, title, message,
        related_product_id, is_read, created_at::text AS created_at
    `,
    [
      input.user_id,
      input.type,
      input.title,
      input.message,
      input.related_product_id ?? null,
    ],
  );

  return result.rows[0];
}

export async function findNotificationsByUser(
  userId: number,
  limit = 20,
): Promise<Notification[]> {
  const result = await pool.query<Notification>(
    `
      SELECT
        id, user_id, type, title, message,
        related_product_id, is_read, created_at::text AS created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [userId, limit],
  );

  return result.rows;
}

export async function countUnreadNotifications(userId: number): Promise<number> {
  const result = await pool.query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `,
    [userId],
  );

  return Number(result.rows[0]?.total ?? 0);
}

export async function markNotificationRead(
  userId: number,
  notificationId: number,
): Promise<boolean> {
  const result = await pool.query(
    `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1 AND id = $2
    `,
    [userId, notificationId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  await pool.query(
    `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1 AND is_read = false
    `,
    [userId],
  );
}
