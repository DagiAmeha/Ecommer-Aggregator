"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminGuard } from "./AdminGuard";
import { logout as firebaseLogout } from "@/services/auth.service";

const navItems = [
  {
    href: "/admin",
    label: "Overview",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin/vendors",
    label: "Vendors",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

function getPageTitle(pathname: string | null): string {
  if (pathname?.startsWith("/admin/reports")) return "Reports";
  if (pathname?.startsWith("/admin/vendors")) return "Vendors";
  if (pathname?.startsWith("/admin/users")) return "Users";
  return "Overview";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <AdminGuard>
      <div className="flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white/80 shadow-[0_8px_30px_rgba(16,35,30,0.08)] backdrop-blur lg:h-[calc(100vh-8rem)] dark:border-white/10 dark:bg-white/5">
        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[280px_1fr]">
          {/* ── Sidebar ── */}
          <aside
            className={`border-b border-black/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 px-5 py-6 text-white lg:border-b-0 lg:border-r lg:border-white/5 lg:overflow-y-auto ${
              mobileMenuOpen ? "block" : "hidden"
            } lg:block`}
          >
            <div className="mb-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-400/80">
                Admin Panel
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight">
                Aggregator Market
              </p>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href ||
                      pathname?.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-400" />
                    )}
                    <span className={isActive ? "text-emerald-400" : "text-white/40 group-hover:text-white/70 transition"}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-8">
              <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  Role
                </p>
                <p className="mt-1 text-sm font-semibold text-white/90">
                  Administrator
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await firebaseLogout();
                  window.location.href = "/login";
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex min-h-0 flex-col lg:h-full">
            <div className="border-b border-black/10 bg-white/60 px-4 py-4 backdrop-blur sm:px-6 sm:py-5 lg:px-8 lg:py-6 dark:border-white/10 dark:bg-white/[0.02]">
              <div className="mb-3 flex items-center justify-between lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  aria-label="Toggle admin menu"
                  aria-expanded={mobileMenuOpen}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    {mobileMenuOpen ? (
                      <path d="M6 6l12 12M18 6 6 18" />
                    ) : (
                      <>
                        <path d="M4 7h16" />
                        <path d="M4 12h16" />
                        <path d="M4 17h16" />
                      </>
                    )}
                  </svg>
                </button>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
                  Admin Menu
                </span>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
                Admin Dashboard
              </p>
              <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                {getPageTitle(pathname)}
              </h1>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-50/50 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 dark:bg-transparent">
              {children}
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
