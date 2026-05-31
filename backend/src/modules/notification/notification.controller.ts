import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  countUnreadNotifications,
  findNotificationsByUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notification.model";
import { sendError, sendSuccess } from "../../utils/api-response";

const notificationIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export async function listNotificationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const items = await findNotificationsByUser(userId);
    const unreadCount = await countUnreadNotifications(userId);
    sendSuccess(res, { items, unread_count: unreadCount });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationReadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const params = notificationIdSchema.parse(req.params);
    const updated = await markNotificationRead(userId, params.id);

    if (!updated) {
      sendError(res, "Notification not found", 404);
      return;
    }

    sendSuccess(res, { updated: true });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsReadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    await markAllNotificationsRead(userId);
    sendSuccess(res, { updated: true });
  } catch (error) {
    next(error);
  }
}
