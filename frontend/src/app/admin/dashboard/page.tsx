"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPlatformReports } from "@/services/admin.service";
import type { PlatformReports } from "@/types/admin";

export default function AdminDashboardPage() {
  const [reports, setReports] = useState<PlatformReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchPlatformReports();
        if (active) {
          setReports(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load reports",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
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

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Total Users
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {reports?.total_users ?? 0}
          </p>
        </div>
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Total Vendors
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {reports?.total_vendors ?? 0}
          </p>
        </div>
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Total Products
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {reports?.total_products ?? 0}
          </p>
        </div>
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Total Reviews
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {reports?.total_reviews ?? 0}
          </p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            New Users (7 Days)
          </p>
          <p className="mt-3 text-2xl font-semibold text-emerald-700">
            +{reports?.new_users_last_7_days ?? 0}
          </p>
        </div>
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Pending Vendors
          </p>
          <p className="mt-3 text-2xl font-semibold text-amber-700">
            {reports?.pending_vendors ?? 0}
          </p>
        </div>
        <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Active Users (30 Days)
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {reports?.active_users_last_30_days ?? 0}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          Quick Actions
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link
            href="/admin/users"
            className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            Manage Users
          </Link>
          <Link
            href="/admin/vendors"
            className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            Review Vendors
          </Link>
          <Link
            href="/admin/reports"
            className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            View Reports
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          Recent Activity
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">
          Latest platform events
        </h2>

        <div className="mt-4 space-y-2">
          {reports?.recent_activity?.length ? (
            reports.recent_activity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-2xl border border-black/10 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {activity.description}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {activity.type.replace(/_/g, " ")}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No recent activity.</p>
          )}
        </div>
      </div>
    </div>
  );
}
