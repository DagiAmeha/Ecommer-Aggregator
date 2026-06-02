"use client";

import Link from "next/link";
import { useAuthContext } from "@/components/AuthProvider";

export default function HeaderBrandLink() {
  const { role, loading } = useAuthContext();

  // The brand always links to a sensible "home" for the current role, so it
  // doubles as the way back into the admin/vendor area from anywhere.
  const href =
    !loading && role === "admin"
      ? "/admin"
      : !loading && role === "vendor"
        ? "/vendor/dashboard"
        : "/";

  return (
    <Link
      className="display-font text-2xl font-semibold text-slate-950 dark:text-white"
      href={href}
    >
      Aggregator Market
    </Link>
  );
}
