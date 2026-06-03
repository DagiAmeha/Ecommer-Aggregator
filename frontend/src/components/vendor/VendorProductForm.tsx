"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/types/catalog";
import type { VendorProductInput } from "@/types/vendor";

export function VendorProductForm({
  categories,
  initialProduct,
  onSubmit,
  submitLabel,
  loading,
}: {
  categories: Category[];
  initialProduct?: Product | null;
  onSubmit: (payload: VendorProductInput) => Promise<void>;
  submitLabel: string;
  loading: boolean;
}) {
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [description, setDescription] = useState(
    initialProduct?.description ?? "",
  );
  const [price, setPrice] = useState(
    initialProduct ? String(initialProduct.price) : "",
  );
  const [categoryId, setCategoryId] = useState(
    initialProduct?.category?.id ? String(initialProduct.category.id) : "",
  );
  const [imageUrl, setImageUrl] = useState(initialProduct?.image_url ?? "");
  const [productUrl, setProductUrl] = useState(
    initialProduct?.product_url ?? "",
  );
  const [stockQuantity, setStockQuantity] = useState(
    initialProduct ? String(initialProduct.stock_quantity ?? 0) : "0",
  );
  const isReady = useMemo(() => {
    return name.trim().length > 0 && price && categoryId;
  }, [categoryId, name, price]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isReady) {
      return;
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      stock_quantity: Number(stockQuantity),
      category_id: Number(categoryId),
      image_url: imageUrl.trim() || undefined,
      product_url: productUrl.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600"
            placeholder="Product name"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Price</label>
          <input
            type="number"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            min={0}
            step="0.01"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600"
            placeholder="0.00"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            Stock quantity
          </label>
          <input
            type="number"
            value={stockQuantity}
            onChange={(event) => setStockQuantity(event.target.value)}
            min={0}
            step="1"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Category</label>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600"
          required
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-[120px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600"
          placeholder="Describe the product"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            Image URL
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600"
            placeholder="https://"
          />
        </div>
        
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !isReady}
          className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
