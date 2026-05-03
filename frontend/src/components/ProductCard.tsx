import Link from "next/link";
import type { Product } from "@/types/catalog";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function ProductCard({
  product,
  isSelected,
  onToggleCompare,
}: {
  product: Product;
  isSelected: boolean;
  onToggleCompare: (product: Product) => void;
}) {
  const imageUrl =
    product.image_url ||
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80";

  return (
    <article className="group overflow-hidden rounded-3xl border border-black/10 bg-white/80 shadow-[0_20px_60px_rgba(16,35,30,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(16,35,30,0.12)]">
      <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
        <Link href={`/products/${product.id}`} className="block h-full w-full">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        <div className="absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-transparent" />
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            {product.store?.name ?? `Store`}
          </p>
          <Link href={`/products/${product.id}`} className="block">
            <h3 className="line-clamp-2 text-lg font-semibold text-slate-950 transition group-hover:text-emerald-800">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-slate-500">
            {product.category?.name ?? ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xl font-semibold text-emerald-700">
            {formatPrice(product.price)}
          </p>
          <button
            type="button"
            onClick={() => onToggleCompare(product)}
            className={
              isSelected
                ? "rounded-full border border-emerald-700 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                : "rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white transition hover:bg-emerald-700"
            }
          >
            {isSelected ? "Remove from Compare" : "Add to Compare"}
          </button>
        </div>
        <Link
          href={`/products/${product.id}`}
          className="inline-flex rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
