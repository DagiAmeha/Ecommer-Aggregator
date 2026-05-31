"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/components/WishlistProvider";

export default function WishlistLink() {
  const { user, loading } = useAuth();
  const { count } = useWishlist();

  if (loading || !user) {
    return null;
  }

  return (
    <Link
      className="relative rounded-full border border-black/10 px-4 py-2 pr-10 transition hover:border-emerald-700 hover:text-emerald-800"
      href="/wishlist"
    >
      Wishlist
      {count > 0 ? (
        <span className="absolute right-2 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
