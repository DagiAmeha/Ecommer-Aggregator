"use client";

import { useCallback, useEffect, useState } from "react";

/** Minimal product shape persisted for the "Recently viewed" strip. */
export interface RecentlyViewedItem {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  viewed_at: number;
}

const STORAGE_KEY = "aggregator-recently-viewed";
const MAX_ITEMS = 12;
// Fired on the same tab when the list changes (the native "storage" event only
// fires in *other* tabs), so every mounted hook instance stays in sync.
const EVENT_NAME = "recently-viewed-change";

function readStore(): RecentlyViewedItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is RecentlyViewedItem =>
        !!item &&
        typeof item === "object" &&
        typeof (item as RecentlyViewedItem).id === "number",
    );
  } catch {
    return [];
  }
}

function writeStore(items: RecentlyViewedItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readStore());

    const sync = () => setItems(readStore());
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const recordView = useCallback(
    (product: Omit<RecentlyViewedItem, "viewed_at">) => {
      const current = readStore().filter((item) => item.id !== product.id);
      const next = [{ ...product, viewed_at: Date.now() }, ...current].slice(
        0,
        MAX_ITEMS,
      );
      writeStore(next);
      setItems(next);
    },
    [],
  );

  const clear = useCallback(() => {
    writeStore([]);
    setItems([]);
  }, []);

  return { items, recordView, clear };
}
