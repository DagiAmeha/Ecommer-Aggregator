"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchRecommendations,
  fetchTopSearches,
  fetchTrendingProducts,
} from "@/services/analytics.service";
import type { Product } from "@/types/catalog";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
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
              className="h-56 animate-pulse rounded-3xl border border-black/10 bg-white/70"
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
              className="rounded-3xl border border-black/10 bg-white/80 p-4 shadow-[0_16px_50px_rgba(16,35,30,0.08)] transition hover:-translate-y-1"
            >
              <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    product.image_url ||
                    "https://images.unsplash.com/photo-1513708927688-89046b44c3f9?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-950">
                {product.name}
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                {formatPrice(product.price)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const [trending, setTrending] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [topSearches, setTopSearches] = useState<
    Array<{ query: string; count: number }>
  >([]);
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

  return (
    <section className="space-y-10">
      <div className="rounded-4xl border border-black/10 bg-white/80 p-8 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <p className="display-font text-4xl font-semibold text-slate-950 sm:text-5xl">
          Compare prices across stores
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Discover trending products, explore recommendations, and compare the
          same item from different vendors in one place.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Browse products
          </Link>
          <Link
            href="/compare"
            className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
          >
            Compare now
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
          >
            Your dashboard
          </Link>
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
        <section className="rounded-3xl border border-black/10 bg-white/75 p-5 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Popular searches
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {topSearches.map((item) => (
              <Link
                key={item.query}
                href={`/products?search=${encodeURIComponent(item.query)}`}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
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
