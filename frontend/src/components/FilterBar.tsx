"use client";
import type { Category } from "@/types/catalog";

export function FilterBar({
  categories,
  stores,
  initialCategory = "",
  initialStoreId = "",
  initialMinPrice = "",
  initialMaxPrice = "",
  initialSort = "newest",
  highlightedStoreId,
  onApply,
  onReset,
  bare = false,
  hideStoreFilter = false,
}: {
  categories: Category[];
  stores: { id: number; name: string }[];
  initialCategory?: string;
  initialStoreId?: string;
  initialMinPrice?: string;
  initialMaxPrice?: string;
  highlightedStoreId?: number | null;
  onApply: (filters: {
    category: string;
    storeId: string;
    minPrice: string;
    maxPrice: string;
    sort: string;
  }) => void;
  initialSort?: string;
  onReset: () => void;
  /** Drop the card chrome so this can sit inside a shared container. */
  bare?: boolean;
  /** Hide the store dropdown (e.g. on a single-vendor storefront). */
  hideStoreFilter?: boolean;
}) {
  const gridCols = hideStoreFilter
    ? "md:grid-cols-[1fr_repeat(2,minmax(0,0.7fr))_1fr_auto_auto]"
    : "md:grid-cols-[1fr_1fr_repeat(2,minmax(0,0.7fr))_1fr_auto_auto]";

  return (
    <form
      className={
        bare
          ? `grid gap-3 ${gridCols}`
          : `grid gap-3 rounded-2xl border border-black/10 bg-white/75 p-4 shadow-[0_4px_16px_rgba(16,35,30,0.05)] ${gridCols}`
      }
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onApply({
          category: String(formData.get("category") ?? ""),
          storeId: String(formData.get("storeId") ?? ""),
          minPrice: String(formData.get("minPrice") ?? ""),
          maxPrice: String(formData.get("maxPrice") ?? ""),
          sort: String(formData.get("sort") ?? "newest"),
        });
      }}
    >
      <select
        name="category"
        defaultValue={initialCategory}
        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600"
      >
        <option value="">All categories</option>
        {categories.map((item) => (
          <option key={item.id} value={item.name}>
            {item.name}
          </option>
        ))}
      </select>
      {hideStoreFilter ? null : (
        <select
          name="storeId"
          defaultValue={initialStoreId}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600"
        >
          <option value="">All stores</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
              {highlightedStoreId && store.id === highlightedStoreId
                ? " (Your store)"
                : ""}
            </option>
          ))}
        </select>
      )}
      <input
        name="minPrice"
        defaultValue={initialMinPrice}
        type="number"
        min="0"
        step="0.01"
        placeholder="Min price"
        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
      />
      <input
        name="maxPrice"
        defaultValue={initialMaxPrice}
        type="number"
        min="0"
        step="0.01"
        placeholder="Max price"
        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
      />
      <select
        name="sort"
        defaultValue={initialSort}
        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600"
      >
        <option value="newest">Newest</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
        <option value="rating">Top rated</option>
        <option value="popularity">Most popular</option>
      </select>
      <button
        type="submit"
        className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        Apply
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded-2xl border border-black/10 bg-transparent px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
      >
        Reset
      </button>
    </form>
  );
}
