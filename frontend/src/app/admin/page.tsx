"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAdminStats } from "@/services/admin.service";
import type { AdminStats } from "@/types/admin";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAdminStats();
        if (active) {
          setStats(response);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load admin stats",
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
            className="h-32 animate-pulse rounded-2xl border border-black/10 bg-white/70"
          />
        ))}
      </div>
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
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Total Users
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {stats?.total_users ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Total Vendors
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {stats?.total_vendors ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Suspended Accounts
          </p>
          <p className="mt-3 text-3xl font-semibold text-rose-600">
            {stats?.suspended_accounts ?? 0}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            User Management
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            Manage platform users and roles
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Search, suspend, or update roles for any user account.
          </p>
          <Link
            href="/admin/users"
            className="mt-4 inline-flex items-center rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
          >
            Go to Users
          </Link>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Vendor Management
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            Create and manage vendor accounts
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Add new vendors and manage their access status.
          </p>
          <Link
            href="/admin/vendors"
            className="mt-4 inline-flex items-center rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
          >
            Go to Vendors
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          System reports
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">
          Analytics, imports, and search trends
        </h2>
        <Link
          href="/admin/reports"
          className="mt-4 inline-flex items-center rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
        >
          View reports
        </Link>
      </div>
    </div>
  );
}
