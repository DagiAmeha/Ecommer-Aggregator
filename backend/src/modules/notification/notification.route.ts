import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  listNotificationsHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
} from "./notification.controller";

const notificationRouter = Router();

notificationRouter.use(authMiddleware);
notificationRouter.get("/", listNotificationsHandler);
notificationRouter.patch("/read-all", markAllNotificationsReadHandler);
notificationRouter.patch("/:id/read", markNotificationReadHandler);

export { notificationRouter };
