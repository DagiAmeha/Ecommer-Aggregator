"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createVendorAccount,
  deleteAdminUser,
  fetchAdminUsers,
  reactivateAdminUser,
  suspendAdminUser,
} from "@/services/admin.service";
import type { AdminUser, CreateVendorPayload } from "@/types/admin";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionId, setActionId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateVendorPayload>({
    full_name: "",
    email: "",
    phone: "",
    store_name: "",
    password: "",
    source_type: "manual",
    source_url: "",
  });
  const [creating, setCreating] = useState(false);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [limit, total]);

  useEffect(() => {
    let active = true;

    async function loadVendors() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAdminUsers({
          page,
          limit,
          search: search.trim() || undefined,
          role: "vendor",
          status: statusFilter === "all" ? undefined : statusFilter,
        });

        if (active) {
          setVendors(response.data);
          setTotal(response.pagination.total);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load vendors",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadVendors();

    return () => {
      active = false;
    };
  }, [page, limit, search, statusFilter]);

  async function handleSuspend(vendor: AdminUser) {
    if (!window.confirm(`Suspend ${vendor.email}?`)) {
      return;
    }

    setActionId(vendor.id);
    try {
      const updated = await suspendAdminUser(vendor.id);
      setVendors((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suspend vendor");
    } finally {
      setActionId(null);
    }
  }

  async function handleReactivate(vendor: AdminUser) {
    setActionId(vendor.id);
    try {
      const updated = await reactivateAdminUser(vendor.id);
      setVendors((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reactivate vendor",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(vendor: AdminUser) {
    if (!window.confirm(`Delete ${vendor.email}?`)) {
      return;
    }

    setActionId(vendor.id);
    try {
      await deleteAdminUser(vendor.id);
      setVendors((current) => current.filter((item) => item.id !== vendor.id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vendor");
    } finally {
      setActionId(null);
    }
  }

  async function handleCreateVendor() {
    setCreating(true);
    setError(null);

    try {
      const sourceType = form.source_type ?? "manual";
      const sourceUrl = form.source_url?.trim() ?? "";
      const password = form.password.trim();

      if (!password) {
        setError("Password is required for new vendor accounts.");
        return;
      }

      if (sourceType !== "manual" && !sourceUrl) {
        setError("Source URL is required for API or web scraping vendors.");
        return;
      }

      const created = await createVendorAccount({
        ...form,
        password,
        source_type: sourceType,
        source_url: sourceType === "manual" ? undefined : sourceUrl,
      });
      setVendors((current) => [created.user, ...current]);
      setShowModal(false);
      setForm({
        full_name: "",
        email: "",
        phone: "",
        store_name: "",
        password: "",
        source_type: "manual",
        source_url: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vendor");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-black/10 bg-white p-4 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <div className="flex flex-1 flex-wrap gap-3">
          <input
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Search vendors by name or email"
            className="flex-1 rounded-2xl border border-black/10 px-4 py-2 text-sm outline-none"
          />
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value);
            }}
            className="rounded-2xl border border-black/10 px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Create Vendor
        </button>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm">
                    Loading vendors...
                  </td>
                </tr>
              ) : vendors.length ? (
                vendors.map((vendor) => {
                  const isSuspended = vendor.status === "suspended";

                  return (
                    <tr key={vendor.id} className="border-t border-black/5">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-950">
                          {vendor.full_name ?? "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {vendor.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {vendor.store_name ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isSuspended
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {isSuspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(vendor.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {isSuspended ? (
                            <button
                              type="button"
                              disabled={actionId === vendor.id}
                              onClick={() => handleReactivate(vendor)}
                              className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={actionId === vendor.id}
                              onClick={() => handleSuspend(vendor)}
                              className="rounded-full border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:border-amber-400"
                            >
                              Suspend
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={actionId === vendor.id}
                            onClick={() => handleDelete(vendor)}
                            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-400"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm">
                    No vendors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-3xl border border-black/10 bg-white/80 p-4 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1}
          className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() =>
            setPage((current) => Math.min(totalPages, current + 1))
          }
          disabled={page >= totalPages}
          className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  Create Vendor
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                  Add a new vendor account
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <input
                value={form.full_name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    full_name: event.target.value,
                  }))
                }
                placeholder="Full name"
                className="w-full rounded-2xl border border-black/10 px-4 py-2 text-sm"
              />
              <input
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="Email"
                className="w-full rounded-2xl border border-black/10 px-4 py-2 text-sm"
              />
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="Phone (+2519xxxxxxxx)"
                className="w-full rounded-2xl border border-black/10 px-4 py-2 text-sm"
              />
              <input
                value={form.store_name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    store_name: event.target.value,
                  }))
                }
                placeholder="Store name"
                className="w-full rounded-2xl border border-black/10 px-4 py-2 text-sm"
              />
              <input
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder="Password"
                type="password"
                className="w-full rounded-2xl border border-black/10 px-4 py-2 text-sm"
              />
              <select
                value={form.source_type ?? "manual"}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    source_type: event.target.value as
                      | "manual"
                      | "api"
                      | "scraping",
                  }))
                }
                className="w-full rounded-2xl border border-black/10 px-4 py-2 text-sm"
              >
                <option value="manual">Manual</option>
                <option value="api">API</option>
                <option value="scraping">Web Scraping</option>
              </select>
              {form.source_type !== "manual" ? (
                <input
                  value={form.source_url ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      source_url: event.target.value,
                    }))
                  }
                  placeholder={
                    form.source_type === "scraping"
                      ? "https://books.toscrape.com/"
                      : "https://example.com/products.json"
                  }
                  className="w-full rounded-2xl border border-black/10 px-4 py-2 text-sm"
                />
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleCreateVendor}
              disabled={creating}
              className="mt-5 w-full rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create vendor"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
