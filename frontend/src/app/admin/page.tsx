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
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl border border-black/5 bg-white dark:border-white/10 dark:bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/30 dark:text-rose-300">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {error}
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats?.total_users ?? 0,
      color: "text-slate-900 dark:text-white",
      iconBg: "bg-blue-100 dark:bg-blue-500/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
    {
      label: "Total Vendors",
      value: stats?.total_vendors ?? 0,
      color: "text-slate-900 dark:text-white",
      iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "Suspended",
      value: stats?.suspended_accounts ?? 0,
      color: "text-rose-600 dark:text-rose-400",
      iconBg: "bg-rose-100 dark:bg-rose-500/20",
      iconColor: "text-rose-600 dark:text-rose-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      ),
    },
  ];

  const quickActions = [
    {
      label: "User Management",
      subtitle: "Manage platform users and roles",
      description: "Search, suspend, or update roles for any user account.",
      href: "/admin/users",
      cta: "Go to Users",
      gradient: "from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5",
      iconBg: "bg-blue-100 dark:bg-blue-500/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
    {
      label: "Vendor Management",
      subtitle: "Create and manage vendor accounts",
      description: "Add new vendors and manage their access status.",
      href: "/admin/vendors",
      cta: "Go to Vendors",
      gradient: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5",
      iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Stat cards ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {card.label}
                </p>
                <p className={`mt-3 text-4xl font-bold tracking-tight ${card.color}`}>
                  {card.value}
                </p>
              </div>
              <div className={`rounded-xl p-2.5 ${card.iconBg}`}>
                <span className={card.iconColor}>{card.icon}</span>
              </div>
            </div>
            {/* Decorative gradient bar */}
            <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-emerald-400 to-teal-300 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        ))}
      </div>

      {/* ── Quick actions ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {quickActions.map((action) => (
          <div
            key={action.label}
            className={`group relative overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-br ${action.gradient} p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:border-white/10`}
          >
            <div className="flex items-start gap-4">
              <div className={`rounded-xl p-2.5 ${action.iconBg}`}>
                <span className={action.iconColor}>{action.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {action.label}
                </p>
                <h2 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {action.subtitle}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {action.description}
                </p>
                <Link
                  href={action.href}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-emerald-600 hover:text-emerald-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-300"
                >
                  {action.cta}
                  <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Reports card ── */}
      <div className="group relative overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:border-white/10 dark:from-amber-500/5 dark:to-orange-500/5">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-amber-100 p-2.5 dark:bg-amber-500/20">
            <span className="text-amber-600 dark:text-amber-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              System reports
            </p>
            <h2 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Analytics, imports, and search trends
            </h2>
            <Link
              href="/admin/reports"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-emerald-600 hover:text-emerald-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-300"
            >
              View reports
              <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
