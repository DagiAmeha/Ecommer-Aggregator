"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import HeaderAuth from "./HeaderAuth";
import HeaderBrandLink from "./HeaderBrandLink";
import WishlistLink from "./WishlistLink";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
      <header className="mb-8 rounded-[28px] border border-black/10 bg-white/70 px-5 py-4 shadow-[0_16px_50px_rgba(16,35,30,0.08)] backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <HeaderBrandLink />
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <Link
              className="rounded-full border border-black/10 px-4 py-2 transition hover:border-emerald-700 hover:text-emerald-800"
              href="/products"
            >
              Products
            </Link>
            <Link
              className="rounded-full border border-black/10 px-4 py-2 transition hover:border-emerald-700 hover:text-emerald-800"
              href="/compare"
            >
              Compare
            </Link>
            <Link
              className="rounded-full border border-black/10 px-4 py-2 transition hover:border-emerald-700 hover:text-emerald-800"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <WishlistLink />
            <NotificationBell />
            <ThemeToggle />
            <HeaderAuth />
          </nav>
        </div>
      </header>
      <main className="flex-1 pb-8">{children}</main>
    </div>
  );
}
