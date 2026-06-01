"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import HeaderAuth from "./HeaderAuth";
import HeaderBrandLink from "./HeaderBrandLink";
import WishlistLink from "./WishlistLink";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/compare", label: "Compare" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
      <header className="mb-8 rounded-2xl border border-black/10 bg-white/70 px-5 py-4 shadow-[0_4px_16px_rgba(16,35,30,0.05)] backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <HeaderBrandLink />
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {/* Primary navigation — text links grouped together. The active
                route gets a filled emerald pill so the current tab is clear. */}
            <div className="flex flex-wrap items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={
                    isActive(link.href)
                      ? "rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white transition"
                      : "rounded-full px-4 py-2 text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {/* Divider between navigation and account actions. */}
            <span className="mx-1 hidden h-6 w-px bg-black/10 sm:block" />
            {/* Account actions — icon controls grouped together. */}
            <div className="flex items-center gap-2">
              <WishlistLink />
              <NotificationBell />
              <ThemeToggle />
              <HeaderAuth />
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1 pb-8">{children}</main>
    </div>
  );
}
