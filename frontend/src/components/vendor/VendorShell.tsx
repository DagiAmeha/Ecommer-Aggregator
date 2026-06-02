"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VendorGuard } from "./VendorGuard";
import { logout as firebaseLogout } from "@/services/auth.service";

const navItems = [
  { href: "/vendor/dashboard", label: "Dashboard" },
  { href: "/vendor/integrations", label: "Integrations" },
  { href: "/vendor/products", label: "Products" },
  { href: "/vendor/products/create", label: "Add Product" },
  { href: "/vendor/store", label: "Store Settings" },
];

export function VendorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <VendorGuard>
      <div className="flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white/80 shadow-[0_4px_16px_rgba(16,35,30,0.05)] lg:h-[calc(100vh-8rem)] dark:border-white/10 dark:bg-white/5">
        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[260px_1fr]">
          <aside className="border-b border-black/10 bg-slate-950 px-5 py-6 text-white lg:border-b-0 lg:border-r lg:overflow-y-auto">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                Vendor Panel
              </p>
              <p className="mt-2 text-xl font-semibold">Aggregator Market</p>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      isActive
                        ? "flex items-center justify-between rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold"
                        : "flex items-center justify-between rounded-2xl px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                    }
                  >
                    {item.label}
                    {isActive ? (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-200">
                        Active
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={async () => {
                await firebaseLogout();
                window.location.href = "/login";
              }}
              className="mt-8 w-full rounded-2xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Logout
            </button>
          </aside>
          <div className="flex min-h-0 flex-col lg:h-full">
            <div className="border-b border-black/10 px-6 py-5 dark:border-white/10">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Vendor Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                {pathname?.startsWith("/vendor/products/create")
                  ? "Add Product"
                  : pathname?.startsWith("/vendor/integrations")
                    ? "Integrations"
                    : pathname?.startsWith("/vendor/products")
                      ? "Products"
                      : pathname?.startsWith("/vendor/store")
                        ? "Store Settings"
                        : "Overview"}
              </h1>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
          </div>
        </div>
      </div>
    </VendorGuard>
  );
}
