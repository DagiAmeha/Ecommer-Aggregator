"use client";

import { useEffect, useState } from "react";
import { fetchPlatformReports } from "@/services/admin.service";
import type { PlatformReports } from "@/types/admin";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<PlatformReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPlatformReports();
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Platform Reports
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            System Analytics & Metrics
          </h2>
        </div>
        <button
          type="button"
          onClick={loadReports}
          className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
        >
          Refresh
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            User Metrics
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Users</span>
              <span className="text-lg font-semibold text-slate-950">
                {reports?.total_users ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">New (7 Days)</span>
              <span className="text-lg font-semibold text-emerald-700">
                +{reports?.new_users_last_7_days ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Active (30 Days)</span>
              <span className="text-lg font-semibold text-slate-950">
                {reports?.active_users_last_30_days ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Vendor Metrics
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Vendors</span>
              <span className="text-lg font-semibold text-slate-950">
                {reports?.total_vendors ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Pending Approval</span>
              <span className="text-lg font-semibold text-amber-700">
                {reports?.pending_vendors ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Active Vendors</span>
              <span className="text-lg font-semibold text-emerald-700">
                {(reports?.total_vendors ?? 0) - (reports?.pending_vendors ?? 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Metrics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Product Metrics
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Products</span>
              <span className="text-lg font-semibold text-slate-950">
                {reports?.total_products ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Avg per Vendor</span>
              <span className="text-lg font-semibold text-slate-950">
                {reports?.total_vendors
                  ? Math.round(
                      (reports.total_products ?? 0) / reports.total_vendors,
                    )
                  : 0}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Engagement Metrics
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Reviews</span>
              <span className="text-lg font-semibold text-slate-950">
                {reports?.total_reviews ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Avg per Product</span>
              <span className="text-lg font-semibold text-slate-950">
                {reports?.total_products
                  ? (
                      (reports.total_reviews ?? 0) / reports.total_products
                    ).toFixed(2)
                  : "0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          Activity Log
        </p>
        <h3 className="mt-2 text-lg font-semibold text-slate-950">
          Recent Platform Events
        </h3>

        <div className="mt-4 space-y-2">
          {reports?.recent_activity?.length ? (
            reports.recent_activity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between rounded-2xl border border-black/10 bg-slate-50 px-4 py-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-950">
                    {activity.description}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(activity.timestamp).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="ml-3 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {activity.type.replace(/_/g, " ")}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No recent activity.</p>
          )}
        </div>
      </div>

      {/* System Health Placeholder */}
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          System Health
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold text-slate-950">
            All systems operational
          </span>
        </div>
      </div>
    </div>
  );
}
