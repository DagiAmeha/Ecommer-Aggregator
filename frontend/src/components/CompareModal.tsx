"use client";

import { useEffect } from "react";
import { CompareTable } from "./CompareTable";
import type { CompareProduct } from "@/types/catalog";

export function CompareModal({
  open,
  onClose,
  products,
  loading,
  error,
  onRemoveProduct,
  compareCount,
}: {
  open: boolean;
  onClose: () => void;
  products: CompareProduct[];
  loading: boolean;
  error: string | null;
  onRemoveProduct: (id: number) => void;
  compareCount: number;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#f8f4ee] shadow-[0_30px_100px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between gap-4 border-b border-black/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Compare ({compareCount}/4)
            </p>
            <h2 className="display-font mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
              Side-by-side comparison
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-5 sm:px-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-12 animate-pulse rounded-2xl bg-white/80" />
              <div className="h-[420px] animate-pulse rounded-3xl bg-white/80" />
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {error}
            </div>
          ) : (
            <CompareTable
              products={products}
              onRemoveProduct={onRemoveProduct}
            />
          )}
        </div>
      </div>
    </div>
  );
}
