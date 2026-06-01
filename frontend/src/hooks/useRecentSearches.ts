"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "aggregator-recent-searches";
const EVENT_NAME = "recent-searches-change";
const MAX_ITEMS = 8;

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function readRecentSearches(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeRecentSearches(items: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // Ignore storage failures.
  }
}

export function useRecentSearches() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readRecentSearches());

    const sync = () => setItems(readRecentSearches());
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const record = useCallback((value: string) => {
    const query = normalize(value);
    if (!query) return;

    const next = [
      query,
      ...readRecentSearches().filter(
        (item) => item.toLowerCase() !== query.toLowerCase(),
      ),
    ].slice(0, MAX_ITEMS);

    writeRecentSearches(next);
    setItems(next);
  }, []);

  const clear = useCallback(() => {
    writeRecentSearches([]);
    setItems([]);
  }, []);

  return { items, record, clear };
}
