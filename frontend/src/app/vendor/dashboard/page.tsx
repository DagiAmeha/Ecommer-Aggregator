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
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-3xl border border-black/10 bg-white/70"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  const sourceType = storeSource?.source_type ?? "manual";
  const isManual = sourceType === "manual";
  const isScraping = sourceType === "scraping";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Total Products
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {stats?.total_products ?? 0}
          </p>
        </div>
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Total Categories
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {stats?.total_categories ?? 0}
          </p>
        </div>
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Latest Products
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {stats?.latest_products?.length ?? 0}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Ingestion Source
            </p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                storeSource?.source_type !== "manual" && storeSource.is_active
                  ? "bg-emerald-100 text-emerald-700"
                  : storeSource?.source_type !== "manual"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-200 text-slate-700"
              }`}
            >
              {storeSource?.source_type === "scraping"
                ? storeSource.is_active
                  ? "Scraping Active"
                  : "Scraping Disabled"
                : storeSource?.source_type === "api"
                  ? storeSource.is_active
                    ? "API Active"
                    : "API Disabled"
                  : "Manual"}
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-950">
            {storeSource?.url ? storeSource.url : "No source configured"}
          </p>
          <Link
            href={isManual ? "/vendor/products/create" : "/vendor/integrations"}
            className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-700"
          >
            {isManual ? "Add manual product" : "Manage integration"}
          </Link>
        </div>
        {isManual ? (
          <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Manual Management
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">
              Add, edit, and delete products
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Your catalog is managed manually without automated syncing.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              {isScraping ? "Scrape Health" : "Sync Health"}
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">
              {formatRelativeTime(storeSource?.last_sync_at ?? null)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Use the integrations page to run a manual sync or review results.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Recent Products
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              Latest listings from your store
            </h2>
          </div>
          <Link
            href="/vendor/products"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
          >
            View all
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {stats?.latest_products?.length ? (
            stats.latest_products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">
                      {product.name}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        product.source === "api" ||
                        product.source === "scraping"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {product.source === "api"
                        ? "API"
                        : product.source === "scraping"
                          ? "SCRAPING"
                          : "MANUAL"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {product.category?.name ?? ""}
                  </p>
                </div>
                <div className="text-sm font-semibold text-emerald-700">
                  {formatPrice(product.price)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              {isManual
                ? "No products yet. Add your first product to get started."
                : "No imported products yet. Run a sync to fetch items."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
