"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCategories } from "@/services/catalog.service";
import {
  createVendorProduct,
  fetchVendorStoreSource,
} from "@/services/vendor.service";
import type { Category } from "@/types/catalog";
import { VendorProductForm } from "@/components/vendor/VendorProductForm";
import type { VendorProductInput } from "@/types/vendor";

export default function VendorCreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeSourceType, setStoreSourceType] = useState<
    "manual" | "api" | null
  >(null);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchCategories();
        if (active) {
          setCategories(response);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load categories",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadStoreSource() {
      try {
        const response = await fetchVendorStoreSource();

        if (active) {
          setStoreSourceType(response.source_type);
        }
      } catch {
        if (active) {
          setStoreSourceType(null);
        }
      }
    }

    loadStoreSource();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(payload: VendorProductInput) {
    setSaving(true);
    setError(null);

    try {
      await createVendorProduct(payload);
      router.push("/vendor/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-3xl border border-black/10 bg-white/70" />
    );
  }

  if (storeSourceType === "api") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5 text-center text-sm text-amber-700 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
          This store uses API-based product synchronization. Products are
          managed automatically through the connected API source.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <VendorProductForm
        categories={categories}
        onSubmit={handleSubmit}
        submitLabel="Create product"
        loading={saving}
      />
    </div>
  );
}
