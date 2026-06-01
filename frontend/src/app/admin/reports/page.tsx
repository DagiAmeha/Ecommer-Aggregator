"use client";

import { useEffect, useState } from "react";
import { fetchAdminReports } from "@/services/admin.service";
import type { AdminReports } from "@/services/admin.service";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReports(): Promise<void> {
      setLoading(true);
      try {
        const response = await fetchAdminReports();
        if (active) setReports(response);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load reports");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReports();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="h-48 animate-pulse rounded-2xl border border-black/10 bg-white/70" />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Total products
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {reports?.total_products ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            New users (30 days)
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {reports?.new_users_last_30_days ?? 0}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          Products by source
        </p>
        <div className="mt-4 space-y-2">
          {reports?.products_by_source?.map((item) => (
            <div
              key={item.source}
              className="flex items-center justify-between rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm"
            >
              <span className="font-semibold uppercase">{item.source}</span>
              <span>{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          Top searches
        </p>
        <div className="mt-4 space-y-2">
          {reports?.top_searches?.length ? (
            reports.top_searches.map((item) => (
              <div
                key={item.query}
                className="flex items-center justify-between rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm"
              >
                <span>{item.query}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No search data yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          Recent import jobs
        </p>
        <div className="mt-4 space-y-2">
          {reports?.recent_import_jobs?.length ? (
            reports.recent_import_jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm"
              >
                <p className="font-semibold text-slate-900">
                  Store #{job.store_id} · {job.job_type} · {job.status}
                </p>
                <p className="mt-1 text-slate-600">
                  +{job.imported_count} imported, {job.updated_count} updated,{" "}
                  {job.failed_count} failed
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No import jobs yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
