"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { fetchWishlist } from "@/services/wishlist.service";
import { fetchPriceAlerts } from "@/services/priceAlert.service";
import { fetchNotifications } from "@/services/notification.service";
import { fetchRecommendations } from "@/services/analytics.service";
import type { Product } from "@/types/catalog";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recommended, setRecommended] = useState<Product[]>([]);

  useEffect(() => {
    document.title = "Dashboard | Aggregator Market";
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;

    let active = true;

    async function loadDashboard(): Promise<void> {
      try {
        const [wishlist, alerts, notifications, picks] = await Promise.all([
          fetchWishlist(),
          fetchPriceAlerts(),
          fetchNotifications(),
          fetchRecommendations(undefined, 4),
        ]);

        if (!active) return;
        setWishlistCount(wishlist.items?.length ?? 0);
        setAlertCount(
          alerts.items.filter((item) => item.is_active).length ?? 0,
        );
        setUnreadNotifications(notifications.unread_count ?? 0);
        setRecommended(picks);
      } catch {
        if (!active) return;
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [user]);

  // Don't render protected content until auth is resolved. While loading (or
  // while the redirect to /login is in flight for a signed-out user) show a
  // spinner instead of briefly flashing the dashboard.
  if (loading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="display-font text-4xl font-semibold text-slate-950">
          Your dashboard
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Quick access to wishlist, price alerts, and notifications.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/wishlist"
          className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(16,35,30,0.05)] transition hover:border-emerald-700"
        >
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Wishlist
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {wishlistCount}
          </p>
        </Link>
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Active price alerts
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {alertCount}
          </p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Unread notifications
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {unreadNotifications}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          Recommended
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {recommended.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 transition hover:bg-white"
            >
              <p className="text-sm font-semibold text-slate-950">
                {product.name}
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                {formatPrice(product.price)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
