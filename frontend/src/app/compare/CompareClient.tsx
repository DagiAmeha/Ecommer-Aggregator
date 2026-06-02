"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompareTable } from "@/components/CompareTable";
import { fetchComparisonProducts } from "@/services/catalog.service";
import type { CompareProduct } from "@/types/catalog";

export default function CompareClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ids = useMemo(() => {
    const raw = searchParams?.get("ids") || "";

    return raw
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((value) => Number.isFinite(value) && value > 0)
      .slice(0, 4);
  }, [searchParams]);

  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Compare Products | Aggregator Market";
  }, []);

  useEffect(() => {
    let active = true;

    async function loadComparison(): Promise<void> {
      if (ids.length === 0) {
        setProducts([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetchComparisonProducts(ids);

        if (!active) {
          return;
        }

        setProducts(response);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Failed to load comparison data",
        );
        setProducts([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadComparison();

    return () => {
      active = false;
    };
  }, [ids]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const draftIds = String(formData.get("ids") ?? "");

    const normalizedIds = draftIds
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((value) => Number.isFinite(value) && value > 0)
      .slice(0, 4);

    router.push(
      normalizedIds.length > 0
        ? `/compare?ids=${normalizedIds.join(",")}`
        : "/compare",
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="display-font text-4xl font-semibold text-slate-950 sm:text-5xl">
          Compare products
        </p>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Enter up to four product ids from the same category across different
          stores to compare price, ratings, and store information.
        </p>
      </div>

      <form
        key={ids.join(",")}
        className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white/75 p-4 shadow-[0_4px_16px_rgba(16,35,30,0.05)] sm:flex-row"
        onSubmit={handleSubmit}
      >
        <input
          name="ids"
          type="text"
          defaultValue={ids.join(",")}
          placeholder="1,2,3,4"
          className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
        />
        <button
          type="submit"
          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Compare
        </button>
      </form>

      {loading ? (
        <div className="h-[360px] animate-pulse rounded-2xl border border-black/10 bg-slate-200/70 dark:bg-white/5" />
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <CompareTable products={products} />
      )}
    </section>
  );
}
