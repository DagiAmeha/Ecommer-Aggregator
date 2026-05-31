"use client";

import { useEffect, useState } from "react";
import {
  fetchVendorStoreProfile,
  updateVendorStoreProfile,
} from "@/services/vendor.service";
import type { VendorStoreProfile } from "@/types/vendor";

export default function VendorStoreSettingsPage() {
  const [store, setStore] = useState<VendorStoreProfile | null>(null);
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStore(): Promise<void> {
      setLoading(true);
      try {
        const response = await fetchVendorStoreProfile();
        if (!active) return;
        setStore(response);
        setStoreName(response.store_name);
        setDescription(response.description ?? "");
        setIsActive(response.is_active);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load store");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStore();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateVendorStoreProfile({
        store_name: storeName.trim(),
        description: description.trim() || undefined,
        is_active: isActive,
      });
      setStore(updated);
      setSuccess("Store profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update store");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-48 animate-pulse rounded-3xl border border-black/10 bg-white/70" />
    );
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]"
      >
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          Store Settings
        </p>
        <h2 className="mt-3 text-xl font-semibold text-slate-950">
          Manage your store profile
        </h2>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Store name
            </label>
            <input
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[120px] w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-emerald-600"
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Store is active
          </label>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-rose-600">{error}</p>
        ) : null}
        {success ? (
          <p className="mt-4 text-sm text-emerald-700">{success}</p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save store profile"}
        </button>
      </form>

      {store?.recent_import_jobs?.length ? (
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Recent import jobs
          </p>
          <div className="mt-4 space-y-2">
            {store.recent_import_jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm"
              >
                <p className="font-semibold text-slate-900">
                  {job.job_type.toUpperCase()} · {job.status}
                </p>
                <p className="mt-1 text-slate-600">
                  Imported {job.imported_count}, updated {job.updated_count},
                  failed {job.failed_count}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
