"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/services/api";

type ProfileRole = string | { value?: string } | null | undefined;

type ProfileResponse = {
  role?: ProfileRole;
};

function getRoleValue(role: ProfileRole): string | null {
  if (typeof role === "string") {
    return role;
  }

  if (role && typeof role === "object" && "value" in role) {
    return String(role.value ?? "");
  }

  return null;
}

export default function HeaderBrandLink() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRole() {
      if (!user) {
        setRole(null);
        return;
      }

      try {
        const profile = await apiRequest<ProfileResponse>("/users/me");
        if (active) {
          setRole(getRoleValue(profile.role));
        }
      } catch {
        if (active) {
          setRole(null);
        }
      }
    }

    loadRole();

    return () => {
      active = false;
    };
  }, [user]);

  const href = !loading && role === "vendor" ? "/vendor/dashboard" : "/";

  return (
    <Link
      className="display-font text-2xl font-semibold text-slate-950"
      href={href}
    >
      Aggregator Market
    </Link>
  );
}
