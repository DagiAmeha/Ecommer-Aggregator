"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "./AuthProvider";
import HeaderAuth from "./HeaderAuth";
import HeaderBrandLink from "./HeaderBrandLink";
import WishlistLink from "./WishlistLink";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

type NavLink = { href: string; label: string };

// Consumer-facing navigation. Compare / Wishlist / Notifications are only
// meaningful for shoppers, so they are scoped to the regular-user role below.
const USER_NAV: NavLink[] = [
  { href: "/products", label: "Products" },
  { href: "/compare", label: "Compare" },
  { href: "/dashboard", label: "Dashboard" },
];

const ADMIN_NAV: NavLink[] = [
  { href: "/admin", label: "Admin Dashboard" },
  { href: "/products", label: "Products" },
];

const VENDOR_NAV: NavLink[] = [
  { href: "/vendor/dashboard", label: "Vendor Dashboard" },
  { href: "/products", label: "Products" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { role, loading } = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  // Admin and vendor areas have their own dedicated sidebar/header chrome.
  // Rendering the full consumer nav on top of them produced two competing
  // navigation systems and let a single click strand the user outside their
  // panel. Inside those areas we collapse to a slim header (brand + account)
  // so the in-panel sidebar is the single source of navigation.
  const inAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  const inVendorArea =
    pathname === "/vendor" || pathname.startsWith("/vendor/");
  const slimHeader = inAdminArea || inVendorArea;

  // Outside those areas, the nav is role-aware: an admin/vendor browsing the
  // storefront always has a clear button back to their dashboard, and never
  // sees shopper-only links that don't apply to them.
  const navLinks: NavLink[] = loading
    ? []
    : role === "admin"
      ? ADMIN_NAV
      : role === "vendor"
        ? VENDOR_NAV
        : USER_NAV;

  const showShopperActions =
    !loading && !slimHeader && role !== "admin" && role !== "vendor";
  const showNav = !slimHeader && navLinks.length > 0;

  function navLinkClass(href: string): string {
    return isActive(href)
      ? "rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white transition"
      : "rounded-full px-4 py-2 text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white";
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
      <header className="mb-8 rounded-2xl border border-black/10 bg-white/70 px-5 py-4 shadow-[0_4px_16px_rgba(16,35,30,0.05)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-4">
          <HeaderBrandLink />

          {/* Desktop / tablet navigation. */}
          <nav className="hidden flex-wrap items-center gap-2 text-sm font-medium sm:flex">
            {showNav ? (
              <div className="flex flex-wrap items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={navLinkClass(link.href)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
            {showNav ? (
              <span className="mx-1 hidden h-6 w-px bg-black/10 sm:block dark:bg-white/10" />
            ) : null}
            <div className="flex items-center gap-2">
              {showShopperActions ? (
                <>
                  <WishlistLink />
                  <NotificationBell />
                </>
              ) : null}
              <ThemeToggle />
              <HeaderAuth />
            </div>
          </nav>

          {/* Mobile controls: theme toggle stays inline, everything else lives
              behind the hamburger so the bar never wraps or breaks. */}
          <div className="flex items-center gap-2 sm:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 dark:border-white/10 dark:text-slate-200"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileOpen ? (
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
          </div>
        </div>

        {/* Mobile dropdown panel. */}
        {mobileOpen ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-black/10 pt-4 sm:hidden dark:border-white/10">
            {showNav ? (
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={navLinkClass(link.href)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              {showShopperActions ? (
                <>
                  <WishlistLink />
                  <NotificationBell />
                </>
              ) : null}
              <HeaderAuth />
            </div>
          </div>
        ) : null}
      </header>
      <main className="flex-1 pb-8">{children}</main>
    </div>
  );
}
