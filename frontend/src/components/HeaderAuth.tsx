"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/services/api";
import { logout as firebaseLogout } from "@/services/auth.service";

export default function HeaderAuth() {
  const { user, loading } = useAuth();
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user) {
        setFullName(null);
        return;
      }

      try {
        const profile = await apiRequest<{
          full_name?: string;
          email?: string;
        }>("/users/me");

        if (!active) return;

        setFullName(profile.full_name ?? profile.email ?? null);
      } catch {
        if (active) setFullName(null);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [user]);

  if (loading) {
    return (
      <>
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
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Link
          className="rounded-full border border-black/10 px-4 py-2 transition hover:border-emerald-700 hover:text-emerald-800"
          href="/login"
        >
          Login
        </Link>
        <Link
          className="rounded-full bg-black px-4 py-2 text-white transition hover:bg-slate-800"
          href="/register"
        >
          Register
        </Link>
      </>
    );
  }

  const initial = (fullName ?? user.email ?? "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <>
      <button
        type="button"
        title={fullName ?? user.email ?? "User"}
        onClick={async () => {
          await firebaseLogout();
          // reload to update header state
          window.location.href = "/";
        }}
        className="rounded-full border border-black/10 px-4 py-2 transition hover:border-emerald-700 hover:text-emerald-800"
      >
        Logout
      </button>
      <Link
        title={fullName ?? user.email ?? "User"}
        href="/profile"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-white"
        aria-label="Profile"
      >
        {initial}
      </Link>
    </>
  );
}
