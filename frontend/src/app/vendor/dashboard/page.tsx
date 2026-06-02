"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchVendorStats,
  fetchVendorStoreSource,
} from "@/services/vendor.service";
import type { VendorStats, VendorStoreSource } from "@/types/vendor";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRelativeTime(value: string | null | undefined): string {
  if (!value) {
    return "Not synced yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not synced yet";
  }

  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffSeconds < 60) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export default function VendorDashboardPage() {
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [storeSource, setStoreSource] = useState<VendorStoreSource | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setLoading(true);
      setError(null);

      try {
        const [statsResponse, sourceResponse] = await Promise.all([
          fetchVendorStats(),
          fetchVendorStoreSource(),
        ]);

        if (active) {
          setStats(statsResponse);
          setStoreSource(sourceResponse);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load dashboard",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl border border-black/5 bg-white dark:border-white/10 dark:bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/30 dark:text-rose-300">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {error}
      </div>
    );
  }

  const sourceType = storeSource?.source_type ?? "manual";
  const isManual = sourceType === "manual";
  const isScraping = sourceType === "scraping";

  const statCards = [
    {
      label: "Total Products",
      value: stats?.total_products ?? 0,
      color: "text-slate-900 dark:text-white",
      iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      label: "Product Views",
      value: stats?.total_views ?? 0,
      color: "text-slate-900 dark:text-white",
      iconBg: "bg-blue-100 dark:bg-blue-500/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      label: "Low Stock Items",
      value: stats?.low_stock_products ?? 0,
      color: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-500/20",
      iconColor: "text-amber-600 dark:text-amber-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      label: "Total Categories",
      value: stats?.total_categories ?? 0,
      color: "text-slate-900 dark:text-white",
      iconBg: "bg-violet-100 dark:bg-violet-500/20",
      iconColor: "text-violet-600 dark:text-violet-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      ),
    },
    {
      label: "Store Clicks",
      value: stats?.total_clicks ?? 0,
      color: "text-slate-900 dark:text-white",
      iconBg: "bg-cyan-100 dark:bg-cyan-500/20",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
        </svg>
      ),
    },
    {
      label: "Latest Products",
      value: stats?.latest_products?.length ?? 0,
      color: "text-slate-900 dark:text-white",
      iconBg: "bg-pink-100 dark:bg-pink-500/20",
      iconColor: "text-pink-600 dark:text-pink-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
    },
  ];

  // Source status badge
  const statusLabel =
    storeSource?.source_type === "scraping"
      ? storeSource?.is_active
        ? "Scraping Active"
        : "Scraping Disabled"
      : storeSource?.source_type === "api"
        ? storeSource?.is_active
          ? "API Active"
          : "API Disabled"
        : "Manual";

  const statusClass =
    storeSource?.source_type !== "manual" && storeSource?.is_active
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
      : storeSource?.source_type !== "manual"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
        : "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400";

  return (
    <div className="space-y-8">
      {/* ── Stat cards ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {card.label}
                </p>
                <p className={`mt-3 text-4xl font-bold tracking-tight ${card.color}`}>
                  {card.value}
                </p>
              </div>
              <div className={`rounded-xl p-2.5 ${card.iconBg}`}>
                <span className={card.iconColor}>{card.icon}</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-emerald-400 to-teal-300 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        ))}
      </div>

      {/* ── Ingestion source + Health ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="group relative overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-white/10 dark:from-emerald-500/5 dark:to-teal-500/5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-500/20">
                <span className="text-emerald-600 dark:text-emerald-400">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  Ingestion Source
                </p>
                <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                  {storeSource?.url ? storeSource.url : "No source configured"}
                </p>
              </div>
            </div>
            <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
          <div className="mt-4 pl-14">
            <Link
              href={isManual ? "/vendor/products/create" : "/vendor/integrations"}
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              {isManual ? "Add manual product" : "Manage integration"}
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>

        {isManual ? (
          <div className="group relative overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-white/10 dark:from-blue-500/5 dark:to-indigo-500/5">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-500/20">
                <span className="text-blue-600 dark:text-blue-400">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  Manual Management
                </p>
                <h2 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Add, edit, and delete products
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Your catalog is managed manually without automated syncing.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="group relative overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-white/10 dark:from-cyan-500/5 dark:to-blue-500/5">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-cyan-100 p-2.5 dark:bg-cyan-500/20">
                <span className="text-cyan-600 dark:text-cyan-400">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {isScraping ? "Scrape Health" : "Sync Health"}
                </p>
                <h2 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {formatRelativeTime(storeSource?.last_sync_at ?? null)}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Use the integrations page to run a manual sync or review results.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Recent products ── */}
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-3 border-b border-black/5 px-6 py-5 dark:border-white/10">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-violet-100 p-2.5 dark:bg-violet-500/20">
              <span className="text-violet-600 dark:text-violet-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                Recent Products
              </p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Latest listings from your store
              </h2>
            </div>
          </div>
          <Link
            href="/vendor/products"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-emerald-600 hover:text-emerald-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-300"
          >
            View all
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>

        <div className="divide-y divide-black/5 dark:divide-white/10">
          {stats?.latest_products?.length ? (
            stats.latest_products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-2 px-6 py-4 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-white/[0.03]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {product.name}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        product.source === "api" ||
                        product.source === "scraping"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400"
                      }`}
                    >
                      {product.source === "api"
                        ? "API"
                        : product.source === "scraping"
                          ? "SCRAPING"
                          : "MANUAL"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {product.category?.name ?? ""}
                  </p>
                </div>
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {formatPrice(product.price)}
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isManual
                  ? "No products yet. Add your first product to get started."
                  : "No imported products yet. Run a sync to fetch items."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
