"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function RecentlyViewed({ excludeId }: { excludeId?: number }) {
  const { items, clear } = useRecentlyViewed();

  const visible = items.filter((item) => item.id !== excludeId);

  if (visible.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3 border-t border-black/10 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
          Recently viewed
        </p>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-medium text-slate-500 transition hover:text-emerald-700"
        >
          Clear
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {visible.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.id}`}
            className="group flex w-40 shrink-0 flex-col gap-2 rounded-2xl border border-black/10 bg-white/80 p-3 transition hover:border-emerald-700 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-500"
          >
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-white/5">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-full w-full object-contain p-2 transition group-hover:scale-105"
                />
              ) : (
                <span className="text-xs text-slate-400">No image</span>
              )}
            </div>
            <p className="line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              {item.name}
            </p>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {formatPrice(item.price)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
