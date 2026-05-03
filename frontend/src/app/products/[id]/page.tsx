"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchProductDetail, fetchProducts } from "@/services/catalog.service";
import type { Product } from "@/types/catalog";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = Number(params?.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Product Details | Aggregator Market";
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProduct(): Promise<void> {
      if (Number.isNaN(productId)) {
        setError("Invalid product id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetchProductDetail(productId);
        const data = response.product;

        if (!active) {
          return;
        }
        console.log("Fetched product detail:", response);
        setProduct(data);

        const categoryName = data?.category?.name;
        if (categoryName) {
          try {
            const related = await fetchProducts({
              category: categoryName,
              limit: 4,
              page: 1,
            });

            if (active) {
              setSimilarProducts(
                related.data.filter((item) => item.id !== data.id).slice(0, 3),
              );
            }
          } catch {
            if (active) setSimilarProducts([]);
          }
        } else {
          if (active) setSimilarProducts([]);
        }
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Failed to load product details",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  return (
    <section className="space-y-6">
      <button
        type="button"
        onClick={() => router.push("/products")}
        className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-700 hover:text-emerald-800"
      >
        Back to products
      </button>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-96 animate-pulse rounded-4xl border border-black/10 bg-white/70" />
          <div className="space-y-4">
            <div className="h-56 animate-pulse rounded-4xl border border-black/10 bg-white/70" />
            <div className="h-56 animate-pulse rounded-4xl border border-black/10 bg-white/70" />
          </div>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : product ? (
        <div className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="overflow-hidden rounded-4xl border border-black/10 bg-white/80 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
              <div className="aspect-4/3 bg-slate-100">
                <img
                  src={
                    product.image_url ||
                    "https://images.unsplash.com/photo-1513708927688-89046b44c3f9?auto=format&fit=crop&w=1400&q=80"
                  }
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-5 rounded-4xl border border-black/10 bg-white/80 p-7 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  {product.category?.name ?? ""}
                </p>
                <h1 className="display-font text-4xl font-semibold text-slate-950">
                  {product.name}
                </h1>
              </div>
              <p className="text-base leading-7 text-slate-600">
                {product.description ||
                  "No description was provided for this item."}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                  {formatPrice(product.price)}
                </span>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  Sold by {product.store?.name ?? "Unknown"}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-black/10 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Category
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {product.category?.name ?? ""}
                  </p>
                </div>
                <div className="rounded-3xl border border-black/10 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Store
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {product.store?.name ?? ""}
                  </p>
                </div>
                <div className="rounded-3xl border border-black/10 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Created at
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatDate(product.created_at)}
                  </p>
                </div>
                <div className="rounded-3xl border border-black/10 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Product url
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-950">
                    {product.product_url ?? "Not available"}
                  </p>
                </div>
              </div>

              {product.product_url ? (
                <a
                  href={product.product_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Go to Store
                </a>
              ) : (
                <span className="inline-flex w-fit items-center justify-center rounded-full bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500">
                  No store link available
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-4xl border border-black/10 bg-white/80 p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Endpoint
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                GET /api/products/{product.id}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This view now reads the exact product detail payload returned by
                the backend route, including the nested category and store data
                used by the API.
              </p>
            </div>

            <div className="rounded-4xl border border-black/10 bg-white/80 p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Store
              </p>
              <h2 className="mt-2 display-font text-2xl font-semibold text-slate-950">
                {product.store?.name ?? ""}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The backend exposes this as the product&apos;s live store name,
                so the page can present the same identity that comes back from
                the API.
              </p>
            </div>
          </div>

          {similarProducts.length > 0 ? (
            <div className="space-y-4 rounded-4xl border border-black/10 bg-white/80 p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Similar products
                </p>
                <h2 className="mt-2 display-font text-2xl font-semibold text-slate-950">
                  More in {product.category?.name ?? ""}
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {similarProducts.map((item) => (
                  <Link
                    key={item.id}
                    href={`/products/${item.id}`}
                    className="rounded-3xl border border-black/10 bg-slate-50 p-4 transition hover:-translate-y-1 hover:bg-white"
                  >
                    <p className="text-sm font-semibold text-slate-950">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.store?.name ?? ""}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-emerald-700">
                      {formatPrice(item.price)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
