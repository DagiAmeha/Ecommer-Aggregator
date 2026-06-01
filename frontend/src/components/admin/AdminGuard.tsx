"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyProfile } from "@/services/user.service";

function getRoleValue(role: unknown): string | null {
  if (typeof role === "string") {
    return role;
  }

  if (role && typeof role === "object" && "value" in role) {
    return String((role as { value?: string }).value ?? "");
  }

  return null;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function verifyRole() {
      if (loading) {
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const profile = await fetchMyProfile();
        const role = getRoleValue(profile.role);

        if (!active) {
          return;
        }

        if (role !== "admin") {
          router.replace("/products");
          return;
        }
      } catch {
        if (active) {
          router.replace("/login");
        }
        return;
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    verifyRole();

    return () => {
      active = false;
    };
  }, [loading, router, user]);

  if (loading || checking) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/70 px-6 py-8 text-sm text-slate-600 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
        Checking admin access...
      </div>
    );
  }

  return <>{children}</>;
}
