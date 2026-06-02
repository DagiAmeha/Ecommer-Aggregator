"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useWishlist } from "@/components/WishlistProvider";
import { FilterBar } from "@/components/FilterBar";
import { SearchBar } from "@/components/SearchBar";
import { SavedSearches } from "@/components/SavedSearches";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { ProductList } from "@/components/ProductList";
import { CompareModal } from "@/components/CompareModal";
import type {
  Product,
  Pagination,
  Category,
  Store,
  ProductSort,
  SearchSuggestion,
  CompareProduct,
} from "@/types/catalog";
import {
  fetchCategories,
  fetchComparisonProducts,
  fetchProducts,
  fetchSearchSuggestions,
  fetchStores,
} from "@/services/catalog.service";
import { addToWishlist, removeFromWishlist } from "@/services/wishlist.service";
import { fetchVendorStoreSource } from "@/services/vendor.service";
import { fetchMyProfile } from "@/services/user.service";

const PAGE_SIZE = 9;

export default function ProductsPageContent() {
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
    <>
      <section className="space-y-6">
        <div className="space-y-3">
          <p className="display-font text-4xl font-semibold text-slate-950 sm:text-5xl">
            Browse Products
          </p>
        </div>

        {compareMessage ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            {compareMessage}
          </div>
        ) : null}

        <div className="space-y-3 rounded-2xl border border-black/10 bg-white/75 p-4 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
          <SearchBar
            key={`search-${resetKey}`}
            bare
            initialValue={search}
            loading={loading}
            recentSearches={recentSearches.items}
            suggestions={searchSuggestions}
            didYouMean={search.trim() && pagination.total <= 2 ? didYouMean : null}
            onValueChange={setSearchDraft}
            onClearRecentSearches={recentSearches.clear}
            onSearch={(value) => {
              recentSearches.record(value);
              setPage(1);
              setSearch(value);
              setSearchDraft(value);
            }}
          />
          <div className="border-t border-black/10 pt-3">
            <FilterBar
              key={`filters-${resetKey}`}
              bare
              categories={categories}
              stores={stores}
              initialCategory={category}
              initialStoreId={storeId}
              initialMinPrice={minPrice}
              initialMaxPrice={maxPrice}
              initialSort={sort}
              highlightedStoreId={vendorStoreId}
              onApply={({
                category: nextCategory,
                storeId: nextStoreId,
                minPrice: nextMin,
                maxPrice: nextMax,
                sort: nextSort,
              }) => {
                setPage(1);
                setCategory(nextCategory);
                setStoreId(nextStoreId);
                setMinPrice(nextMin);
                setMaxPrice(nextMax);
                setSort((nextSort as ProductSort) || "newest");
              }}
              onReset={() => {
                setPage(1);
                setSearch("");
                setSearchDraft("");
                setCategory("");
                setStoreId("");
                setMinPrice("");
                setMaxPrice("");
                setSort("newest");
                setResetKey((current) => current + 1);
              }}
            />
          </div>
        </div>

        {search.trim() && pagination.total <= 2 && didYouMean ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>Did you mean</span>
            <button
              type="button"
              onClick={() => {
                recentSearches.record(didYouMean);
                setPage(1);
                setSearch(didYouMean);
                setSearchDraft(didYouMean);
                setResetKey((current) => current + 1);
              }}
              className="rounded-full border border-emerald-600/30 px-3 py-1.5 font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              {didYouMean}
            </button>
            <span>?</span>
          </div>
        ) : null}
      </section>

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

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/60 px-4 py-2.5">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{compareList.length}</span>{" "}
          of 4 selected to compare
        </p>
        <button
          type="button"
          onClick={() => setCompareModalOpen(true)}
          disabled={compareList.length < 2}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
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
    </>
  );
}
