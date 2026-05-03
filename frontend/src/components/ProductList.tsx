import type { Product } from "@/types/catalog";
import { ProductCard } from "./ProductCard";

export function ProductList({
  products,
  loading,
  error,
  compareList,
  onToggleCompare,
}: {
  products: Product[];
  loading: boolean;
  error: string | null;
  compareList: number[];
  onToggleCompare: (product: Product) => void;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[340px] animate-pulse rounded-3xl border border-black/10 bg-white/70"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-black/10 bg-white/75 px-5 py-8 text-center text-slate-600 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
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
          isSelected={compareList.includes(product.id)}
          onToggleCompare={onToggleCompare}
        />
      ))}
    </div>
  );
}
