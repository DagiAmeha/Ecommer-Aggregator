"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, role, loading } = useAuthContext();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (role && role !== "admin") {
      router.replace("/products");
    }
  }, [loading, role, router, user]);

  // While auth/role is resolving, or while a redirect is in flight, show a
  // lightweight checking state instead of flashing protected content.
  if (loading || !user || (role && role !== "admin")) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/70 px-6 py-8 text-sm text-slate-600 shadow-[0_4px_16px_rgba(16,35,30,0.05)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
        Checking admin access...
      </div>
    );
  }

  return <>{children}</>;
}
