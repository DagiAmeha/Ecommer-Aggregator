import { apiRequest } from "./api";

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

export async function fetchNotifications(): Promise<{
  items: Notification[];
  unread_count: number;
}> {
  return apiRequest<{ items: Notification[]; unread_count: number }>(
    "/notifications",
  );
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest("/notifications/read-all", { method: "PATCH" });
}
