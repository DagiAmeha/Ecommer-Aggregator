"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import ProductsPageClient from "./ProductsPageClient";

import { useAuth } from "@/hooks/useAuth";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useWishlist } from "@/components/WishlistProvider";

type ProductsPageProps = {
  searchParams?: {
    search?: string;
  };
};

const PAGE_SIZE = 9;

export default function ProductsPage() {
  const searchParams = useSearchParams();

  const { user } = useAuth();
  const { setCount } = useWishlist();

  const initialSearch = searchParams.get("search") ?? "";

  const [search, setSearch] = useState(initialSearch);
  const [searchDraft, setSearchDraft] = useState(initialSearch);
  const [category, setCategory] = useState("");
  const [storeId, setStoreId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<ProductSort>("newest");
  const [resetKey, setResetKey] = useState(0);
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<Product[]>([]);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [compareList, setCompareList] = useState<number[]>([]);
  const [compareItemsById, setCompareItemsById] = useState<
    Record<number, Product>
  >({});

  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const [compareProducts, setCompareProducts] = useState<CompareProduct[]>(
    [],
  );

  const [compareLoading, setCompareLoading] = useState(false);

  const [compareError, setCompareError] = useState<string | null>(null);

  const [compareMessage, setCompareMessage] = useState<string | null>(null);

  const [vendorStoreId, setVendorStoreId] = useState<number | null>(null);

  const [wishlistLoadingId, setWishlistLoadingId] = useState<number | null>(
    null,
  );

  const [searchSuggestions, setSearchSuggestions] = useState<
    SearchSuggestion[]
  >([]);

  const [didYouMean, setDidYouMean] = useState<string | null>(null);

  const recentSearches = useRecentSearches();

  useEffect(() => {
    document.title = "Products | Aggregator Market";
  }, []);

  useEffect(() => {
    const urlSearch = searchParams.get("search") ?? "";

    setSearch(urlSearch);
    setSearchDraft(urlSearch);
    setPage(1);

    setResetKey((current) => current + 1);
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function loadVendorStore(): Promise<void> {
      if (!user) {
        setVendorStoreId(null);
        return;
      }

      try {
        const profile = await fetchMyProfile();

        const role =
          typeof profile.role === "string"
            ? profile.role
            : profile.role?.value;

        if (!active) {
          return;
        }

        if (role !== "vendor") {
          setVendorStoreId(null);
          return;
        }

        const source = await fetchVendorStoreSource();

        if (active) {
          setVendorStoreId(source.store_id ?? null);
        }
      } catch {
        if (active) {
          setVendorStoreId(null);
        }
      }
    }

    loadVendorStore();

    return () => {
      active = false;
    };
  }, [user]);

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

    fetchStores()
      .then((items) => {
        if (active) {
          setStores(items);
        }
      })
      .catch(() => {
        if (active) {
          setStores([]);
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
          store_id: storeId ? Number(storeId) : undefined,
          min_price: minPrice ? Number(minPrice) : undefined,
          max_price: maxPrice ? Number(maxPrice) : undefined,
          sort,
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
  }, [category, maxPrice, minPrice, page, search, sort, storeId]);

  useEffect(() => {
    const query = searchDraft.trim();

    if (query.length < 2) {
      setSearchSuggestions([]);
      setDidYouMean(null);
      return;
    }

    let active = true;

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetchSearchSuggestions(query);

        if (!active) return;

        setSearchSuggestions(response.suggestions);
        setDidYouMean(response.didYouMean);
      } catch {
        if (!active) return;

        setSearchSuggestions([]);
        setDidYouMean(null);
      }
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [searchDraft]);

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
          err instanceof Error
            ? err.message
            : "Failed to load comparison data",
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
      setCompareList((current) =>
        current.filter((id) => id !== product.id),
      );

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

    const currentGroupId = selectedProducts[0]?.product_group_id;

    if (currentGroupId && product.product_group_id !== currentGroupId) {
      setCompareMessage(
        "You can only compare the same product from different stores",
      );

      return;
    }

    if (
      selectedProducts.some(
        (item) =>
          item.store?.id && item.store.id === product.store?.id,
      )
    ) {
      setCompareMessage(
        "You cannot compare products from the same store",
      );

      return;
    }

    setCompareList((current) => [...current, product.id]);

    setCompareItemsById((current) => ({
      ...current,
      [product.id]: product,
    }));
  }

  async function handleToggleWishlist(
    product: Product,
  ): Promise<void> {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setWishlistLoadingId(product.id);

    const nextWishlisted = !product.is_wishlisted;

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id
          ? { ...item, is_wishlisted: nextWishlisted }
          : item,
      ),
    );

    try {
      if (nextWishlisted) {
        await addToWishlist(product.id);
        setCount((prev) => prev + 1);
      } else {
        await removeFromWishlist(product.id);
        setCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? { ...item, is_wishlisted: product.is_wishlisted }
            : item,
        ),
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update wishlist",
      );
    } finally {
      setWishlistLoadingId(null);
    }
  }

  function handleRemoveComparedProduct(id: number): void {
    setCompareList((current) =>
      current.filter((item) => item !== id),
    );

    setCompareItemsById((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function handleClearCompare(): void {
    setCompareList([]);
    setCompareItemsById({});
    setCompareMessage(null);
  }

  const totalPages = useMemo(() => {
    return Math.max(
      1,
      Math.ceil(pagination.total / pagination.limit),
    );
  }, [pagination.limit, pagination.total]);

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-full bg-slate-200" />
          <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      }
    >
      <SavedSearches
        isAuthenticated={Boolean(user)}
        current={{
          query: search,
          category,
          minPrice,
          maxPrice,
        }}
        onApply={(criteria) => {
          setPage(1);
          setSearch(criteria.query);
          setSearchDraft(criteria.query);
          setCategory(criteria.category ?? "");
          setStoreId("");
          setMinPrice(criteria.minPrice ?? "");
          setMaxPrice(criteria.maxPrice ?? "");
          setResetKey((current) => current + 1);
        }}
      />

      <RecentlyViewed />

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
        onToggleWishlist={handleToggleWishlist}
        wishlistLoadingId={wishlistLoadingId}
      />

      <div className="flex items-center justify-between gap-3 border-t border-black/10 pt-4">
        <button
          type="button"
          onClick={() =>
            setPage((current) => Math.max(1, current - 1))
          }
          disabled={loading || pagination.page <= 1}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm text-slate-500">
          Page {pagination.page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => setPage((current) => current + 1)}
          disabled={loading || pagination.page >= totalPages}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
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

      {compareList.length > 0 ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 border-t border-white/20 bg-slate-950/75 px-5 py-3 backdrop-blur-lg transition-all duration-300">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/50">
              Comparing
            </p>

            <p className="text-sm font-semibold text-white">
              {compareList.length} of 4 products
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearCompare}
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/40 hover:text-white"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => setCompareModalOpen(true)}
              disabled={compareList.length < 2}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Compare now
            </button>
          </div>
        </div>
      ) : null}
    </Suspense>
  );
}
