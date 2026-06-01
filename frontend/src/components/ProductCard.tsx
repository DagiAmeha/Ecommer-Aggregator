import Link from "next/link";
import type { Product } from "@/types/catalog";
import { StarRatingDisplay } from "./StarRating";
import { ProductImage } from "./ProductImage";

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
  onToggleWishlist,
  wishlistLoading,
}: {
  product: Product;
  isSelected: boolean;
  onToggleCompare: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  wishlistLoading?: boolean;
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-black/10 bg-white/80 shadow-[0_4px_16px_rgba(16,35,30,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(16,35,30,0.08)]">
      <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
        <Link href={`/products/${product.id}`} className="block h-full w-full">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-transparent" />
        {onToggleWishlist ? (
          <button
            type="button"
            onClick={() => onToggleWishlist(product)}
            disabled={wishlistLoading}
            className={`absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/90 text-slate-900 shadow-sm transition hover:scale-105 ${
              product.is_wishlisted ? "text-rose-600" : "text-slate-700"
            } ${wishlistLoading ? "opacity-60" : ""}`}
            aria-label={
              product.is_wishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill={product.is_wishlisted ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          </button>
        ) : null}
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
          <StarRatingDisplay
            rating={product.average_rating ?? 0}
            count={product.review_count ?? 0}
          />
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
                : "rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
            }
          >
            {isSelected ? "Remove from Compare" : "Add to Compare"}
          </button>
        </div>
        <Link
          href={`/products/${product.id}`}
          className="inline-flex rounded-full border border-emerald-600/30 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
