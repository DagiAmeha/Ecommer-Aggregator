"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { ProductImage } from "@/components/ProductImage";
import {
  fetchRecommendations,
  fetchTopSearches,
  fetchTrendingProducts,
} from "@/services/analytics.service";
import { fetchProducts, fetchStores } from "@/services/catalog.service";
import type { Product } from "@/types/catalog";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

// Round a real count down to a clean threshold and add "+" so the trust line
// reads "5,000+" / "50+" from live data without overstating it.
function approxCount(value: number): string {
  if (value <= 0) return "0";
  const base =
    value >= 1000 ? 1000 : value >= 100 ? 100 : value >= 10 ? 10 : 1;
  const floored = Math.floor(value / base) * base;
  const formatted = new Intl.NumberFormat("en-US").format(floored);
  return base === 1 ? formatted : `${formatted}+`;
}

function ProductStrip({
  title,
  subtitle,
  products,
  loading,
}: {
  title: string;
  subtitle: string;
  products: Product[];
  loading: boolean;
}) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
          {subtitle}
        </p>
        <h2 className="display-font mt-2 text-3xl font-semibold text-slate-950">
          {title}
        </h2>
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-2xl border border-black/10 bg-slate-200/70 dark:bg-white/5"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-sm text-slate-500">
          No products yet. Browse the catalog to start building trends.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white/80 shadow-[0_4px_16px_rgba(16,35,30,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(16,35,30,0.08)]"
            >
              <div className="aspect-square overflow-hidden bg-slate-100">
                <ProductImage
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                {product.store?.name ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {product.store.name}
                  </p>
                ) : null}
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-950 transition group-hover:text-emerald-800">
                  {product.name}
                </p>
                <p className="mt-auto pt-2 text-base font-semibold text-emerald-700">
                  {formatPrice(product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [trending, setTrending] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [topSearches, setTopSearches] = useState<
    Array<{ query: string; count: number }>
  >([]);
  const [stats, setStats] = useState<{
    products: number;
    stores: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Aggregator Market";
  }, []);

  useEffect(() => {
    let active = true;

    async function loadHome(): Promise<void> {
      setLoading(true);
      try {
        const [trendingItems, recommendedItems, searches] = await Promise.all([
          fetchTrendingProducts(8),
          fetchRecommendations(undefined, 8),
          fetchTopSearches(),
        ]);

        if (!active) return;
        setTrending(trendingItems);
        setRecommended(recommendedItems);
        setTopSearches(searches);
      } catch {
        if (!active) return;
        setTrending([]);
        setRecommended([]);
        setTopSearches([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHome();
    return () => {
      active = false;
    };
  }, []);

  // Real catalog counts for the hero trust line. Left null (and hidden) if the
  // backend is unreachable — we never show fabricated numbers.
  useEffect(() => {
    let active = true;

    async function loadStats(): Promise<void> {
      try {
        const [productList, stores] = await Promise.all([
          fetchProducts({ page: 1, limit: 1 }),
          fetchStores(),
        ]);

        if (!active) return;
        setStats({
          products: productList.pagination?.total ?? 0,
          stores: stores.length,
        });
      } catch {
        if (active) setStats(null);
      }
    }

    loadStats();
    return () => {
      active = false;
    };
  }, []);

  function goToSearch(query: string): void {
    const trimmed = query.trim();
    router.push(
      trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : "/products",
    );
  }

  return (
    <section className="space-y-10">
      <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white/80 p-6 shadow-[0_4px_16px_rgba(16,35,30,0.05)] sm:p-8">
        {/* Subtle emerald brand wash so the hero reads as ours. */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <h1 className="display-font text-4xl font-bold text-slate-950 sm:text-5xl">
            Compare prices across stores
          </h1>
          {stats ? (
            <p className="mt-3 text-sm font-medium text-slate-500">
              <span className="text-emerald-700">
                {approxCount(stats.products)}
              </span>{" "}
              products
              <span className="mx-2 text-slate-300">•</span>
              <span className="text-emerald-700">
                {approxCount(stats.stores)}
              </span>{" "}
              stores
            </p>
          ) : null}
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            Discover trending products, explore recommendations, and compare the
            same item from different vendors in one place.
          </p>
          <div className="mt-6">
            <SearchBar onSearch={goToSearch} />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/products"
              className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Browse products
            </Link>
        
          </div>
        </div>
      </div>

      <ProductStrip
        title="Trending products"
        subtitle="Most viewed and clicked"
        products={trending}
        loading={loading}
      />

      <ProductStrip
        title="Recommended for you"
        subtitle="Popular picks"
        products={recommended}
        loading={loading}
      />

      {topSearches.length > 0 ? (
        <section className="border-t border-black/10 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Popular searches
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {topSearches.map((item) => (
              <Link
                key={item.query}
                href={`/products?search=${encodeURIComponent(item.query)}`}
                className="rounded-full border border-black/10 px-3.5 py-1.5 text-sm font-medium text-slate-600 transition hover:border-emerald-700 hover:text-emerald-800"
              >
                {item.query} ({item.count})
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
