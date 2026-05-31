"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  fetchVendorStoreSource,
  syncVendorProducts,
  updateVendorStoreSource,
} from "@/services/vendor.service";
import type { VendorStoreSource, VendorSyncResult } from "@/types/vendor";

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

export default function VendorIntegrationsPage() {
  const [source, setSource] = useState<VendorStoreSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<VendorSyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

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
        setApiUrl(response.url ?? "");
        setIsActive(Boolean(response.is_active));
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

    const storedSyncAt =
      typeof window !== "undefined"
        ? window.localStorage.getItem("vendorLastSyncAt")
        : null;

    setLastSyncAt(storedSyncAt);
    loadSource();

    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    setSaveMessage(null);
    setError(null);

    const trimmedUrl = apiUrl.trim();
    if (!trimmedUrl || !isValidUrl(trimmedUrl)) {
      setError("Please enter a valid API URL before saving.");
      return;
    }

    setSaving(true);

    try {
      const updated = await updateVendorStoreSource({
        url: trimmedUrl,
        is_active: isActive,
      });

      setSource(updated);
      setSaveMessage("Configuration saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save configuration",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSync() {
    setSyncError(null);
    setSyncResult(null);
    setSaveMessage(null);
    setSyncing(true);

    try {
      const result = await syncVendorProducts();
      const now = new Date().toISOString();

      setSyncResult(result);
      setLastSyncAt(now);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("vendorLastSyncAt", now);
      }

      const refreshed = await fetchVendorStoreSource();
      setSource(refreshed);
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : "Failed to sync products",
      );
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-3xl border border-black/10 bg-white/70" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-3xl border border-black/10 bg-white/70" />
          <div className="h-64 animate-pulse rounded-3xl border border-black/10 bg-white/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              API Source Status
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

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Source Type
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {source?.source_type === "api" ? "API" : "Manual"}
            </p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              API URL
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {source?.url ? source.url : "Not configured"}
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
          <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Manage Products
            </p>
            <Link
              href="/vendor/products"
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
            >
              View products
            </Link>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {saveMessage ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {saveMessage}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            API Configuration
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">
            Configure your API source
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Provide the endpoint that returns your product feed and control
            whether syncing is active.
          </p>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                API URL
              </label>
              <input
                type="url"
                value={apiUrl}
                onChange={(event) => setApiUrl(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600"
                placeholder="https://your-store.com/api/products"
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Source Active
                </p>
                <p className="text-xs text-slate-500">
                  Toggle to enable or disable API synchronization.
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
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Sync Now
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">
              Trigger a manual product sync
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This will fetch products from your configured API and import any
              updates.
            </p>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="mt-4 w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncing ? "Syncing products..." : "Sync Products Now"}
            </button>
          </div>

          {syncError ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {syncError}
            </div>
          ) : null}

          {syncResult ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">
                Last Sync Result
              </p>
              <div className="mt-3 grid gap-2 text-sm">
                <p>Imported Products: {syncResult.imported_products}</p>
                <p>Updated Products: {syncResult.updated_products}</p>
                <p>Failed Products: {syncResult.failed_products}</p>
                <p>Sources Processed: {syncResult.sources_processed}</p>
                <p>Sources Failed: {syncResult.sources_failed}</p>
              </div>
              {syncResult.source_errors.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-white/70 p-3 text-xs text-emerald-700">
                  <p className="font-semibold">Errors</p>
                  <ul className="mt-2 space-y-1">
                    {syncResult.source_errors.map((item) => (
                      <li key={`${item.source_id}-${item.store_id}`}>
                        {item.url}: {item.error}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-black/10 bg-slate-950 px-6 py-5 text-white shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <p className="text-xs uppercase tracking-[0.28em] text-white/60">
          API Managed Products
        </p>
        <h3 className="mt-2 text-lg font-semibold">
          Products are automatically synced from your API
        </h3>
        <p className="mt-2 text-sm text-white/70">
          This store uses API-based synchronization. Products are imported from
          the configured endpoint and cannot be manually created.
        </p>
      </div>
    </div>
  );
}
