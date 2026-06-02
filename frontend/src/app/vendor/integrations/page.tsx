"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  fetchVendorStoreSource,
  syncVendorStoreSource,
  updateVendorStoreSource,
} from "@/services/vendor.service";
import type { VendorSourceSyncResult, VendorStoreSource } from "@/types/vendor";
import {
  notifyError,
  notifyLoading,
  notifyUpdate,
} from "@/utils/notifications";

function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return "Not synced yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not synced yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

function isValidUrl(value: string): boolean {
  try {
    return Boolean(new URL(value));
  } catch {
    return false;
  }
}

function renderSyncStatus(
  status: VendorStoreSource["last_sync_status"],
): string {
  if (!status || status === "idle") {
    return "Not run";
  }

  if (status === "partial") {
    return "Partial";
  }

  if (status === "failed") {
    return "Failed";
  }

  return "Success";
}

export default function VendorIntegrationsPage() {
  const [source, setSource] = useState<VendorStoreSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<VendorSourceSyncResult | null>(
    null,
  );
  const [syncError, setSyncError] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<"manual" | "api" | "scraping">(
    "manual",
  );
  const [sourceName, setSourceName] = useState("");

  const statusLabel = useMemo(() => {
    if (!source || source.source_type === "manual") {
      return "Not configured";
    }

    return source.is_active ? "Connected" : "Disabled";
  }, [source]);

  const statusTone = useMemo(() => {
    if (!source || source.source_type === "manual") {
      return "bg-slate-100 text-slate-600";
    }

    return source.is_active
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700";
  }, [source]);

  useEffect(() => {
    let active = true;

    async function loadSource() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchVendorStoreSource();

        if (!active) {
          return;
        }

        setSource(response);
        setSourceUrl(response.url ?? "");
        setIsActive(Boolean(response.is_active));
        setSourceType(response.source_type ?? "manual");
        setSourceName(response.source_name ?? "");
        setLastSyncAt(response.last_sync_at ?? null);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load integration settings",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSource();

    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    setError(null);

    const trimmedUrl = sourceUrl.trim();
    if (sourceType !== "manual") {
      if (!trimmedUrl || !isValidUrl(trimmedUrl)) {
        const message = "Please enter a valid URL before saving.";
        setError(message);
        notifyError(new Error(message), message);
        return;
      }

      const hostname = new URL(trimmedUrl).hostname;
      if (sourceType === "scraping" && hostname !== "books.toscrape.com") {
        const message = "Scraping is restricted to books.toscrape.com.";
        setError(message);
        notifyError(new Error(message), message);
        return;
      }
    }

    setSaving(true);
    const toastId = notifyLoading("Saving integration settings...");

    try {
      const updated = await updateVendorStoreSource({
        source_type: sourceType,
        url: sourceType === "manual" ? undefined : trimmedUrl,
        is_active: sourceType === "manual" ? false : isActive,
        source_name: sourceName.trim() || undefined,
      });

      setSource(updated);
      setLastSyncAt(updated.last_sync_at ?? null);
      notifyUpdate(toastId, "Configuration saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save configuration",
      );
      notifyUpdate(
        toastId,
        err instanceof Error ? err.message : "Failed to save configuration",
        true,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSync() {
    setSyncError(null);
    setSyncResult(null);
    setSyncing(true);
    const toastId = notifyLoading("Syncing products...");

    try {
      if (!source || source.source_type === "manual") {
        const message = "No active source configured for syncing.";
        setSyncError(message);
        notifyUpdate(toastId, message, true);
        return;
      }

      const result = await syncVendorStoreSource();
      setSyncResult(result);

      const refreshed = await fetchVendorStoreSource();
      setSource(refreshed);
      setLastSyncAt(refreshed.last_sync_at ?? null);
      notifyUpdate(toastId, "Sync completed successfully.");
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : "Failed to sync products",
      );
      notifyUpdate(
        toastId,
        err instanceof Error ? err.message : "Failed to sync products",
        true,
      );
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-2xl border border-black/10 bg-white/70" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl border border-black/10 bg-white/70" />
          <div className="h-64 animate-pulse rounded-2xl border border-black/10 bg-white/70" />
        </div>
      </div>
    );
  }

  const syncStatusLabel = renderSyncStatus(source?.last_sync_status ?? null);
  const importedCount = source?.last_imported_count ?? 0;
  const isManual = sourceType === "manual";
  const syncActionLabel = "Sync Now";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Ingestion Source Status
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              Integration health and connection details
            </h2>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Source Type
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {source?.source_type === "scraping"
                ? "Scraping"
                : source?.source_type === "api"
                  ? "API"
                  : "Manual"}
            </p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {source?.source_type === "scraping" ? "Base URL" : "API URL"}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {source?.url ? source.url : "Not configured"}
            </p>
          </div> */}
          {!isManual ? (
            <>
              <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {sourceType === "scraping" ? "Scrape Status" : "Sync Status"}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {syncStatusLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Imported Count
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {importedCount}
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Last Sync
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {formatRelativeTime(lastSyncAt)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatTimestamp(lastSyncAt)}
                </p>
              </div>
            </>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span>Manage Products:</span>
          <Link
            href="/vendor/products"
            className="font-semibold text-emerald-700"
          >
            View products
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Source Configuration
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">
            Configure your ingestion source
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Provide the endpoint that returns your product feed and control
            whether syncing is active.
          </p>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Source type
              </label>
              <select
                value={sourceType}
                onChange={(event) => {
                  const nextType = event.target.value as
                    | "manual"
                    | "api"
                    | "scraping";
                  setSourceType(nextType);
                  if (nextType === "scraping") {
                    setSourceUrl("https://books.toscrape.com/");
                    setSourceName("BooksToScrape");
                  }
                }}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600"
              >
                <option value="manual">Manual</option>
                <option value="api">API feed</option>
                <option value="scraping">Web scraping</option>
              </select>
            </div>

            {sourceType !== "manual" ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  {sourceType === "scraping" ? "Base URL" : "API URL"}
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600"
                  placeholder={
                    sourceType === "scraping"
                      ? "https://books.toscrape.com/"
                      : "https://example.com/products.json"
                  }
                />
              </div>
            ) : null}

            {sourceType === "scraping" ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Source name
                </label>
                <input
                  value={sourceName}
                  onChange={(event) => setSourceName(event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600"
                  placeholder="BooksToScrape"
                />
              </div>
            ) : null}

            {sourceType !== "manual" ? (
              <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Source Active
                  </p>
                  <p className="text-xs text-slate-500">
                    Toggle to enable or disable source synchronization.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive((current) => !current)}
                  className={`relative h-8 w-14 rounded-full transition ${
                    isActive ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                  aria-pressed={isActive}
                >
                  <span
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                      isActive ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {!isManual ? (
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                {sourceType === "scraping" ? "Run Scraper" : "Sync Now"}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">
                {sourceType === "scraping"
                  ? "Run a scraping sync"
                  : "Trigger a manual product sync"}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                This will fetch products from your configured source and import
                any updates.
              </p>
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="mt-4 w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {syncing ? "Syncing products..." : syncActionLabel}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-slate-600 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
              Manual stores do not use automated sync. Add products directly
              from the products page.
            </div>
          )}

          {syncError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {syncError}
            </div>
          ) : null}

          {syncResult ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">
                Last Sync Result
              </p>
              <div className="mt-3 grid gap-2 text-sm">
                <p>Source: {syncResult.source_type}</p>
                <p>Imported Products: {syncResult.imported_products}</p>
                <p>Updated Products: {syncResult.updated_products}</p>
                <p>Failed Products: {syncResult.failed_products}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {sourceType !== "manual" ? (
        <div className="rounded-2xl border border-black/10 bg-slate-950 px-6 py-5 text-white shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
          <p className="text-xs uppercase tracking-[0.28em] text-white/60">
            Source Managed Products
          </p>
          <h3 className="mt-2 text-lg font-semibold">
            Products are automatically synced from your source
          </h3>
          <p className="mt-2 text-sm text-white/70">
            This store uses automated synchronization. Products are imported
            from the configured source and cannot be manually created.
          </p>
        </div>
      ) : null}
    </div>
  );
}
