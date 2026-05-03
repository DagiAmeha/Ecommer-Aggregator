"use client";
import type { Category } from "@/types/catalog";

export function FilterBar({
  categories,
  initialCategory = "",
  initialMinPrice = "",
  initialMaxPrice = "",
  onApply,
  onReset,
}: {
  categories: Category[];
  initialCategory?: string;
  initialMinPrice?: string;
  initialMaxPrice?: string;
  onApply: (filters: {
    category: string;
    minPrice: string;
    maxPrice: string;
  }) => void;
  onReset: () => void;
}) {
  return (
    <form
      className="grid gap-3 rounded-3xl border border-black/10 bg-white/75 p-4 shadow-[0_16px_50px_rgba(16,35,30,0.08)] md:grid-cols-[1.2fr_repeat(2,minmax(0,0.8fr))_auto_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onApply({
          category: String(formData.get("category") ?? ""),
          minPrice: String(formData.get("minPrice") ?? ""),
          maxPrice: String(formData.get("maxPrice") ?? ""),
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
      <button
        type="submit"
        className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
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