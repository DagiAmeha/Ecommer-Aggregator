"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createSavedSearch,
  deleteSavedSearch,
  fetchSavedSearches,
  type SavedSearch,
} from "@/services/savedSearch.service";

export interface SavedSearchCriteria {
  query: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
}

interface SavedSearchesProps {
  /** Whether a user is signed in (saved searches require auth). */
  isAuthenticated: boolean;
  /** The current search/filter values, used when saving. */
  current: SavedSearchCriteria;
  /** Apply a saved search back into the page filters. */
  onApply: (criteria: SavedSearchCriteria) => void;
}

function describe(item: SavedSearch): string {
  const parts: string[] = [item.query];
  if (item.category) {
    parts.push(item.category);
  }
  if (item.min_price != null || item.max_price != null) {
    const min = item.min_price != null ? `$${item.min_price}` : "";
    const max = item.max_price != null ? `$${item.max_price}` : "";
    parts.push(`${min}${min && max ? "–" : max ? "≤" : "≥"}${max}`.trim());
  }
  return parts.join(" · ");
}

export function SavedSearches({
  isAuthenticated,
  current,
  onApply,
}: SavedSearchesProps) {
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetchSavedSearches();
      setItems(response.items);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load saved searches",
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (!isAuthenticated) {
    return null;
  }

  const canSave = current.query.trim().length > 0;
  const alreadySaved = items.some(
    (item) =>
      item.query.toLowerCase() === current.query.trim().toLowerCase() &&
      (item.category ?? "") === (current.category ?? ""),
  );

  async function handleSave(): Promise<void> {
    if (!canSave || saving) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createSavedSearch({
        query: current.query.trim(),
        category: current.category || undefined,
        min_price: current.minPrice ? Number(current.minPrice) : undefined,
        max_price: current.maxPrice ? Number(current.maxPrice) : undefined,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save search");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number): Promise<void> {
    setItems((current) => current.filter((item) => item.id !== id));
    try {
      await deleteSavedSearch(id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete saved search",
      );
      await load();
    }
  }

  return (
    <section className="space-y-3 border-t border-black/10 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
          Saved searches
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving || alreadySaved}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {alreadySaved
            ? "Saved"
            : saving
              ? "Saving…"
              : "Save current search"}
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">
          Save a search to quickly run it again later.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item.id}
              className="group inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 py-1 pl-3 pr-1 text-sm text-slate-700 transition hover:border-emerald-700"
            >
              <button
                type="button"
                onClick={() =>
                  onApply({
                    query: item.query,
                    category: item.category ?? "",
                    minPrice: item.min_price != null ? String(item.min_price) : "",
                    maxPrice: item.max_price != null ? String(item.max_price) : "",
                  })
                }
                className="font-medium transition group-hover:text-emerald-800"
              >
                {describe(item)}
              </button>
              <button
                type="button"
                aria-label={`Delete saved search ${item.query}`}
                onClick={() => handleDelete(item.id)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
