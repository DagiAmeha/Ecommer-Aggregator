"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { ProductList } from "@/components/ProductList";
import { SearchBar } from "@/components/SearchBar";
import { StarRatingDisplay } from "@/components/StarRating";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/components/WishlistProvider";
import {
  fetchCategories,
  fetchProducts,
  fetchSearchSuggestions,
  fetchStoreProfile,
} from "@/services/catalog.service";
import { addToWishlist, removeFromWishlist } from "@/services/wishlist.service";
import type {
  Category,
  Pagination,
  Product,
  ProductSort,
  SearchSuggestion,
  StorePublicProfile,
} from "@/types/catalog";
import { useRecentSearches } from "@/hooks/useRecentSearches";

const PAGE_SIZE = 9;

type StorePageClientProps = {
  storeId: number;
};

export default function StorePageClient({ storeId }: StorePageClientProps) {
  const { user } = useAuth();
  const { setCount } = useWishlist();
  const [profile, setProfile] = useState<StorePublicProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [category, setCategory] = useState("");
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlistLoadingId, setWishlistLoadingId] = useState<number | null>(
    null,
  );
  const [searchSuggestions, setSearchSuggestions] = useState<
    SearchSuggestion[]
  >([]);
  const recentSearches = useRecentSearches();

  useEffect(() => {
    let active = true;

    setProfile(null);
    setProfileError(null);

    fetchStoreProfile(storeId)
      .then((data) => {
        if (!active) {
          return;
        }
        setProfile(data);
        document.title = `${data.store.store_name} | Aggregator Market`;
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setProfileError(
          err instanceof Error ? err.message : "Store not found",
        );
      });

    return () => {
      active = false;
    };
  }, [storeId]);

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
          store_id: storeId,
          search: search || undefined,
          category: category || undefined,
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchSuggestions([]);
      return;
    }

    let active = true;
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetchSearchSuggestions(query);
        if (!active) return;
        setSearchSuggestions(response.suggestions);
      } catch {
        if (!active) return;
        setSearchSuggestions([]);
      }
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [searchDraft]);

  async function handleToggleWishlist(product: Product): Promise<void> {
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
        err instanceof Error ? err.message : "Failed to update wishlist",
      );
    } finally {
      setWishlistLoadingId(null);
    }
  }

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(pagination.total / pagination.limit));
  }, [pagination.limit, pagination.total]);

  if (profileError) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-8 text-center text-rose-700">
          {profileError}
        </div>
        <Link
          href="/products"
          className="inline-flex rounded-full border border-emerald-600/30 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          Back to products
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Vendor header — name, rating, product count only. */}
      <div className="space-y-3 rounded-2xl border border-black/10 bg-white/75 p-6 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
          Vendor Store
        </p>
        <h1 className="display-font text-4xl font-semibold text-slate-950 sm:text-5xl">
          {profile ? profile.store.store_name : "Loading store…"}
        </h1>
        {profile ? (
          <div className="flex flex-wrap items-center gap-4">
            <StarRatingDisplay rating={profile.stats.average_rating} />
            <span className="text-sm text-slate-600">
              {profile.stats.total_products}{" "}
              {profile.stats.total_products === 1 ? "product" : "products"}
            </span>
          </div>
        ) : null}
      </div>

      {/* Search + filters share one container, matching the products page. */}
      <div className="space-y-3 rounded-2xl border border-black/10 bg-white/75 p-4 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
        <SearchBar
          key={`search-${resetKey}`}
          bare
          initialValue={search}
          loading={loading}
          recentSearches={recentSearches.items}
          suggestions={searchSuggestions}
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
            hideStoreFilter
            categories={categories}
            stores={[]}
            initialCategory={category}
            initialMinPrice={minPrice}
            initialMaxPrice={maxPrice}
            initialSort={sort}
            onApply={({
              category: nextCategory,
              minPrice: nextMin,
              maxPrice: nextMax,
              sort: nextSort,
            }) => {
              setPage(1);
              setCategory(nextCategory);
              setMinPrice(nextMin);
              setMaxPrice(nextMax);
              setSort((nextSort as ProductSort) || "newest");
            }}
            onReset={() => {
              setPage(1);
              setSearch("");
              setSearchDraft("");
              setCategory("");
              setMinPrice("");
              setMaxPrice("");
              setSort("newest");
              setResetKey((current) => current + 1);
            }}
          />
        </div>
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
        onToggleWishlist={handleToggleWishlist}
        wishlistLoadingId={wishlistLoadingId}
      />

      <div className="flex items-center justify-between gap-3 border-t border-black/10 pt-4">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
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
    </section>
  );
}
