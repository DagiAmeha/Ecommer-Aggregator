"use client";

import { useEffect, useState } from "react";
import { fetchAllVendors, updateVendorStatus } from "@/services/admin.service";
import type { AdminVendor } from "@/types/admin";

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingVendorId, setUpdatingVendorId] = useState<number | null>(null);

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAllVendors();
      setVendors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(vendorId: number, newStatus: boolean) {
    setUpdatingVendorId(vendorId);

    try {
      await updateVendorStatus(vendorId, newStatus);
      // Reload vendors to reflect changes
      await loadVendors();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to update vendor status",
      );
    } finally {
      setUpdatingVendorId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Vendor Tracking
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            {vendors.length} Total Vendors
          </h2>
        </div>
        <button
          type="button"
          onClick={loadVendors}
          className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/10">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Store Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Owner
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Products
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => {
                const isUpdating = updatingVendorId === vendor.id;

                return (
                  <tr
                    key={vendor.id}
                    className="border-b border-black/5 transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {vendor.id}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {vendor.store_name}
                        </p>
                        {vendor.description && (
                          <p className="text-xs text-slate-500">
                            {vendor.description.substring(0, 50)}
                            {vendor.description.length > 50 ? "..." : ""}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {vendor.owner_name || "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {vendor.owner_email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {vendor.total_products}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          vendor.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {vendor.is_active ? "Active" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(vendor.id, !vendor.is_active)
                        }
                        disabled={isUpdating}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                          vendor.is_active
                            ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        } ${isUpdating ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        {isUpdating
                          ? "Updating..."
                          : vendor.is_active
                            ? "Deactivate"
                            : "Approve"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
