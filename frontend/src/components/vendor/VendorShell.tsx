"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VendorGuard } from "./VendorGuard";
import { logout as firebaseLogout } from "@/services/auth.service";

const navItems = [
  {
    href: "/vendor/dashboard",
    label: "Dashboard",
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
    href: "/vendor/integrations",
    label: "Integrations",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    href: "/vendor/products",
    label: "Products",
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    href: "/vendor/products/create",
    label: "Add Product",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    href: "/vendor/store",
    label: "Store Settings",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

function getPageTitle(pathname: string | null): string {
  if (pathname?.startsWith("/vendor/products/create")) return "Add Product";
  if (pathname?.startsWith("/vendor/integrations")) return "Integrations";
  if (pathname?.startsWith("/vendor/products")) return "Products";
  if (pathname?.startsWith("/vendor/store")) return "Store Settings";
  return "Overview";
}

export function VendorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <VendorGuard>
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
                Vendor Panel
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight">
                Aggregator Market
              </p>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/vendor/products" &&
                  pathname?.startsWith("/vendor/products/create")
                    ? false
                    : pathname?.startsWith(item.href);

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
                  Vendor
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
                  aria-label="Toggle vendor menu"
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
                  Vendor Menu
                </span>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
                Vendor Dashboard
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
    </VendorGuard>
  );
}
