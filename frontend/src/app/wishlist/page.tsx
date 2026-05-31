"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductList } from "@/components/ProductList";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/components/WishlistProvider";
import { fetchWishlist, removeFromWishlist } from "@/services/wishlist.service";
import type { Product } from "@/types/catalog";

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { setCount } = useWishlist();
  const [items, setItems] = useState<Product[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlistLoadingId, setWishlistLoadingId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    document.title = "Wishlist | Aggregator Market";
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    let active = true;

    async function loadWishlist(): Promise<void> {
      if (!user) {
        return;
      }

      setLoadingItems(true);
      setError(null);

      try {
        const response = await fetchWishlist();
        if (active) {
          setItems(response.items ?? []);
          setCount(response.items?.length ?? 0);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load wishlist",
          );
          setItems([]);
        }
      } finally {
        if (active) {
          setLoadingItems(false);
        }
      }
    }

    loadWishlist();

    return () => {
      active = false;
    };
  }, [setCount, user]);

  async function handleToggleWishlist(product: Product): Promise<void> {
    setWishlistLoadingId(product.id);

    setItems((current) => current.filter((item) => item.id !== product.id));
    setCount((prev) => Math.max(0, prev - 1));

    try {
      await removeFromWishlist(product.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update wishlist",
      );
    } finally {
      setWishlistLoadingId(null);
    }
  }

  if (!user && !loading) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="display-font text-4xl font-semibold text-slate-950 sm:text-5xl">
          Your wishlist
        </p>
        <p className="text-sm text-slate-600 sm:text-base">
          Save products you want to revisit or compare later.
        </p>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!loadingItems && items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-4xl border border-black/10 bg-white/80 px-6 py-12 text-center shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-slate-400">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-slate-800">
            Your wishlist is empty
          </p>
          <p className="text-sm text-slate-500">
            Tap the heart icon on any product to save it here.
          </p>
        </div>
      ) : (
        <ProductList
          products={items}
          loading={loadingItems}
          error={null}
          compareList={[]}
          onToggleCompare={() => undefined}
          onToggleWishlist={handleToggleWishlist}
          wishlistLoadingId={wishlistLoadingId}
        />
      )}
    </section>
  );
}
