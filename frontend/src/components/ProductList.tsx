import type { Product } from "@/types/catalog";
import { ProductCard } from "./ProductCard";

export function ProductList({
  products,
  loading,
  error,
  compareList,
  onToggleCompare,
  onToggleWishlist,
  wishlistLoadingId,
}: {
  products: Product[];
  loading: boolean;
  error: string | null;
  compareList?: number[];
  onToggleCompare?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  wishlistLoadingId?: number | null;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[340px] animate-pulse rounded-2xl border border-black/10 bg-slate-200/70 dark:bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/75 px-5 py-8 text-center text-slate-600 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
        No products matched the current filters.
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isSelected={compareList?.includes(product.id) ?? false}
          onToggleCompare={onToggleCompare}
          onToggleWishlist={onToggleWishlist}
          wishlistLoading={wishlistLoadingId === product.id}
        />
      ))}
    </div>
  );
}
