"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchCategories } from "@/services/catalog.service";
import {
  fetchVendorProduct,
  updateVendorProduct,
} from "@/services/vendor.service";
import type { Category, Product } from "@/types/catalog";
import { VendorProductForm } from "@/components/vendor/VendorProductForm";
import type { VendorProductInput } from "@/types/vendor";
import { notifyLoading, notifyUpdate } from "@/utils/notifications";

export default function VendorEditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = Number(params?.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (Number.isNaN(productId)) {
        setError("Invalid product id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [categoriesResponse, productResponse] = await Promise.all([
          fetchCategories(),
          fetchVendorProduct(productId),
        ]);

        if (active) {
          setCategories(categoriesResponse);
          setProduct(productResponse);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load product",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [productId]);

  async function handleSubmit(payload: VendorProductInput) {
    if (!product) {
      return;
    }

    setSaving(true);
    setError(null);
    const toastId = notifyLoading("Updating product...");

    try {
      await updateVendorProduct(product.id, payload);
      notifyUpdate(toastId, "Product updated successfully.");
      router.push("/vendor/products");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update product";
      setError(message);
      notifyUpdate(toastId, message, true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-black/10 bg-white/70" />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <VendorProductForm
        categories={categories}
        initialProduct={product}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
        loading={saving}
      />
    </div>
  );
}
