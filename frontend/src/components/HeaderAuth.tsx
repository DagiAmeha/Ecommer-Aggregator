"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { logout as firebaseLogout } from "@/services/auth.service";

export default function HeaderAuth() {
  const { user, loading, profile } = useAuth();
  const fullName = profile?.full_name ?? profile?.email ?? null;

  if (loading) {
    // Neutral placeholder while auth resolves — avoids flashing role-specific
    // links (e.g. showing "Compare" to an admin) before the role is known.
    return (
      <span className="h-10 w-24 animate-pulse rounded-full bg-black/5 dark:bg-white/10" />
    );
  }

  if (!user) {
    return (
      <>
        <Link
          className="rounded-full border border-black/10 px-3 py-2 text-sm text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 sm:px-4 dark:border-white/10 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-white"
          href="/login"
        >
          Login
        </Link>
        <Link
          className="rounded-full bg-emerald-600 px-3 py-2 text-sm text-white transition hover:bg-emerald-700 sm:px-4"
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
        className="rounded-full border border-black/10 px-3 py-2 text-sm text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 sm:px-4 dark:border-white/10 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-white"
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
