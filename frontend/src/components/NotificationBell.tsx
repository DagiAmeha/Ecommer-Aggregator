"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/services/notification.service";

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setUnreadCount(0);
      return;
    }

    let active = true;

    async function loadNotifications(): Promise<void> {
      try {
        const response = await fetchNotifications();
        if (!active) return;
        setItems(response.items);
        setUnreadCount(response.unread_count);
      } catch {
        if (!active) return;
        setItems([]);
        setUnreadCount(0);
      }
    }

    loadNotifications();
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) {
    return null;
  }

  async function handleRead(id: number): Promise<void> {
    await markNotificationRead(id);
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, is_read: true } : item,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  }

  async function handleReadAll(): Promise<void> {
    await markAllNotificationsRead();
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-black/10 transition hover:border-emerald-700 hover:text-emerald-800"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
          <path
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5"
            strokeWidth="1.8"
          />
          <path d="M10 20a2 2 0 0 0 4 0" strokeWidth="1.8" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-3xl border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(16,35,30,0.15)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleReadAll}
                className="text-xs font-semibold text-emerald-700"
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">No notifications yet.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!item.is_read) {
                      void handleRead(item.id);
                    }
                  }}
                  className={`w-full rounded-2xl border px-3 py-2 text-left text-sm ${
                    item.is_read
                      ? "border-black/5 bg-slate-50 text-slate-600"
                      : "border-emerald-200 bg-emerald-50 text-slate-800"
                  }`}
                >
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs">{item.message}</p>
                  {item.related_product_id ? (
                    <Link
                      href={`/products/${item.related_product_id}`}
                      className="mt-2 inline-block text-xs font-semibold text-emerald-700"
                      onClick={(event) => event.stopPropagation()}
                    >
                      View product
                    </Link>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
