"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  deleteVendorProduct,
  fetchVendorProducts,
} from "@/services/vendor.service";
import type { Product, Pagination } from "@/types/catalog";

const PAGE_SIZE = 10;

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
  }).format(date);
}

export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(pagination.total / pagination.limit));
  }, [pagination.limit, pagination.total]);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchVendorProducts(
          pagination.page,
          pagination.limit,
        );

        if (!active) {
          return;
        }

        setProducts(response.data);
        setPagination(response.pagination);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load products",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [pagination.page, pagination.limit]);

  async function handleDelete(id: number) {
    setDeletingId(id);

    const confirmed = window.confirm(
      "Delete this product? This action cannot be undone.",
    );

    if (!confirmed) {
      setDeletingId(null);
      return;
    }

    try {
      await deleteVendorProduct(id);
      setProducts((current) => current.filter((item) => item.id !== id));
      setPagination((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Products
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            Manage your product catalog
          </h2>
        </div>
        <Link
          href="/vendor/products/create"
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Add product
        </Link>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-3xl border border-black/10 bg-white/70" />
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-black/10 bg-white/75 px-5 py-8 text-center text-slate-600 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          No products found for this store.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]">
                    Image
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]">
                    Name
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]">
                    Price
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]">
                    Category
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]">
                    Source
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]">
                    External ID
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]">
                    Created
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-black/5">
                    <td className="px-4 py-3">
                      <img
                        src={
                          product.image_url ||
                          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80"
                        }
                        alt={product.name}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {product.store?.name ?? ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {product.category?.name ?? ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          product.source === "api"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {product.source === "api" ? "API" : "MANUAL"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {product.external_id ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/vendor/products/${product.id}`}
                          className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === product.id}
                          onClick={() => handleDelete(product.id)}
                          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === product.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-3xl border border-black/10 bg-white/80 p-4 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <button
          type="button"
          onClick={() =>
            setPagination((current) => ({
              ...current,
              page: Math.max(1, current.page - 1),
            }))
          }
          disabled={pagination.page <= 1}
          className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-slate-600">
          Page {pagination.page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() =>
            setPagination((current) => ({
              ...current,
              page: Math.min(totalPages, current.page + 1),
            }))
          }
          disabled={pagination.page >= totalPages}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
