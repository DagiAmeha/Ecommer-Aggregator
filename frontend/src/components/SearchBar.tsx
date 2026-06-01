"use client";

import { useMemo, useState } from "react";
import type { SearchSuggestion } from "@/types/catalog";

export function SearchBar({
  initialValue = "",
  onSearch,
  loading = false,
  bare = false,
  recentSearches = [],
  suggestions = [],
  didYouMean,
  onValueChange,
  onClearRecentSearches,
}: {
  initialValue?: string;
  onSearch: (value: string) => void;
  loading?: boolean;
  /** Drop the card chrome so this can sit inside a shared container. */
  bare?: boolean;
  recentSearches?: string[];
  suggestions?: SearchSuggestion[];
  didYouMean?: string | null;
  onValueChange?: (value: string) => void;
  onClearRecentSearches?: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [focused, setFocused] = useState(false);

  const visibleRecent = useMemo(
    () =>
      recentSearches.filter((item) =>
        item.toLowerCase().includes(value.trim().toLowerCase()),
      ),
    [recentSearches, value],
  );
  const showAssist =
    focused &&
    (visibleRecent.length > 0 || suggestions.length > 0 || Boolean(didYouMean));

  function submitSearch(nextValue: string): void {
    const trimmed = nextValue.trim();
    setValue(trimmed);
    onValueChange?.(trimmed);
    onSearch(trimmed);
    setFocused(false);
  }

  return (
    <form
      className={
        bare
          ? "relative flex flex-col gap-3 sm:flex-row"
          : "relative flex flex-col gap-3 rounded-2xl border border-black/10 bg-white/75 p-4 shadow-[0_4px_16px_rgba(16,35,30,0.05)] sm:flex-row"
      }
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch(value);
      }}
    >
      <input
        name="search"
        value={value}
        type="search"
        placeholder="Search products, stores, or descriptions"
        autoComplete="off"
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        onFocus={() => setFocused(true)}
        onChange={(event) => {
          setValue(event.target.value);
          onValueChange?.(event.target.value);
        }}
        className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Searching..." : "Search"}
      </button>
      {showAssist ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-2xl border border-black/10 bg-white p-3 shadow-[0_8px_24px_rgba(16,35,30,0.08)]">
          {didYouMean ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => submitSearch(didYouMean)}
              className="mb-2 block w-full rounded-xl bg-emerald-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-emerald-100"
            >
              Did you mean{" "}
              <span className="font-semibold text-emerald-700">
                {didYouMean}
              </span>
              ?
            </button>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="space-y-1">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Suggestions
              </p>
              {suggestions.map((item) => (
                <button
                  key={`${item.type}-${item.query}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => submitSearch(item.query)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
                >
                  <span>{item.query}</span>
                  <span className="text-xs capitalize text-slate-400">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {visibleRecent.length > 0 ? (
            <div className={suggestions.length > 0 ? "mt-3 space-y-1" : "space-y-1"}>
              <div className="flex items-center justify-between px-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Recent searches
                </p>
                {onClearRecentSearches ? (
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={onClearRecentSearches}
                    className="text-xs font-medium text-slate-400 transition hover:text-emerald-700"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              {visibleRecent.map((item) => (
                <button
                  key={item}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => submitSearch(item)}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-emerald-700"
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
