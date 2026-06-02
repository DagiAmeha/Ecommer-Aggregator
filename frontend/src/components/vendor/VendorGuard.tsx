"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";

export function VendorGuard({ children }: { children: React.ReactNode }) {
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

    if (role && role !== "vendor") {
      router.replace("/products");
    }
  }, [loading, role, router, user]);

  if (loading || !user || (role && role !== "vendor")) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/70 px-6 py-8 text-sm text-slate-600 shadow-[0_4px_16px_rgba(16,35,30,0.05)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
        Checking vendor access...
      </div>
    );
  }

  return <>{children}</>;
}
