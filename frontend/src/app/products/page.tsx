"use client";

import { useEffect, useMemo, useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { CompareModal } from "@/components/CompareModal";
import { ProductList } from "@/components/ProductList";
import { SearchBar } from "@/components/SearchBar";
import {
  fetchCategories,
  fetchComparisonProducts,
  fetchProducts,
} from "@/services/catalog.service";
import type {
  Category,
  CompareProduct,
  Pagination,
  Product,
} from "@/types/catalog";

const PAGE_SIZE = 9;

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<number[]>([]);
  const [compareItemsById, setCompareItemsById] = useState<
    Record<number, Product>
  >({});
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareProducts, setCompareProducts] = useState<CompareProduct[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareMessage, setCompareMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Products | Aggregator Market";
  }, []);

  useEffect(() => {
    let active = true;

    fetchCategories()
      .then((items) => {
        if (active) {
          setCategories(items);
        }
      })
      .catch(() => {
        if (active) {
          setCategories([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProducts(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchProducts({
          search: search || undefined,
          category: category || undefined,
          min_price: minPrice ? Number(minPrice) : undefined,
          max_price: maxPrice ? Number(maxPrice) : undefined,
          page,
          limit: PAGE_SIZE,
        });

        if (!active) {
          return;
        }

        setProducts(response.data);
        setPagination(response.pagination);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Failed to load products",
        );
        setProducts([]);
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
  }, [category, maxPrice, minPrice, page, search]);

  useEffect(() => {
    if (!compareModalOpen) {
      return;
    }

    let active = true;

    async function loadComparison(): Promise<void> {
      if (compareList.length < 2) {
        setCompareProducts([]);
        setCompareError("Select at least 2 products to compare them.");
        setCompareLoading(false);
        return;
      }

      setCompareLoading(true);
      setCompareError(null);

      try {
        const response = await fetchComparisonProducts(compareList);

        if (!active) {
          return;
        }

        setCompareProducts(response);
      } catch (err) {
        if (!active) {
          return;
        }

        setCompareError(
          err instanceof Error ? err.message : "Failed to load comparison data",
        );
        setCompareProducts([]);
      } finally {
        if (active) {
          setCompareLoading(false);
        }
      }
    }

    loadComparison();

    return () => {
      active = false;
    };
  }, [compareList, compareModalOpen]);

  function handleToggleCompare(product: Product): void {
    setCompareMessage(null);

    if (compareList.includes(product.id)) {
      setCompareList((current) => current.filter((id) => id !== product.id));
      setCompareItemsById((current) => {
        const next = { ...current };
        delete next[product.id];
        return next;
      });
      return;
    }

    if (compareList.length >= 4) {
      setCompareMessage("You can compare up to 4 products.");
      return;
    }

    const selectedProducts = compareList
      .map((id) => compareItemsById[id])
      .filter(Boolean);

    if (selectedProducts.some((item) => item.group_id === product.group_id)) {
      setCompareMessage(
        "You cannot compare the same product from different stores",
      );
      return;
    }

    setCompareList((current) => [...current, product.id]);
    setCompareItemsById((current) => ({
      ...current,
      [product.id]: product,
    }));
  }

  function handleRemoveComparedProduct(id: number): void {
    setCompareList((current) => current.filter((item) => item !== id));
    setCompareItemsById((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(pagination.total / pagination.limit));
  }, [pagination.limit, pagination.total]);

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="display-font text-4xl font-semibold text-slate-950 sm:text-5xl">
          Browse live products
        </p>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Search the live backend catalog, add up to four unique products to
          compare, and open product detail pages without touching mock data.
        </p>
      </div>

      {compareMessage ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {compareMessage}
        </div>
      ) : null}

      <div className="space-y-4">
        <SearchBar
          key={`search-${resetKey}`}
          initialValue={search}
          loading={loading}
          onSearch={(value) => {
            setPage(1);
            setSearch(value);
          }}
        />
        <FilterBar
          key={`filters-${resetKey}`}
          categories={categories}
          initialCategory={category}
          initialMinPrice={minPrice}
          initialMaxPrice={maxPrice}
          onApply={({
            category: nextCategory,
            minPrice: nextMin,
            maxPrice: nextMax,
          }) => {
            setPage(1);
            setCategory(nextCategory);
            setMinPrice(nextMin);
            setMaxPrice(nextMax);
          }}
          onReset={() => {
            setPage(1);
            setSearch("");
            setCategory("");
            setMinPrice("");
            setMaxPrice("");
            setResetKey((current) => current + 1);
          }}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-black/10 bg-white/75 p-4 shadow-[0_16px_50px_rgba(16,35,30,0.08)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
            Comparison
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {compareList.length} of 4 products selected.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCompareModalOpen(true)}
          disabled={compareList.length < 2}
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Compare ({compareList.length}/4)
        </button>
      </div>

      <div className="flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {products.length} of {pagination.total} products
        </p>
        <p>
          Page {pagination.page} of {totalPages}
        </p>
      </div>

      <ProductList
        products={products}
        loading={loading}
        error={error}
        compareList={compareList}
        onToggleCompare={handleToggleCompare}
      />

      <div className="flex items-center justify-between gap-3 rounded-3xl border border-black/10 bg-white/75 p-4 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={loading || pagination.page <= 1}
          className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-slate-600">
          Page {pagination.page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((current) => current + 1)}
          disabled={loading || pagination.page >= totalPages}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <CompareModal
        open={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        products={compareProducts}
        loading={compareLoading}
        error={compareError}
        compareCount={compareList.length}
        onRemoveProduct={handleRemoveComparedProduct}
      />
    </section>
  );
}
