import type { CompareProduct } from "@/types/catalog";
import { StarRatingDisplay } from "./StarRating";
import { ProductImage } from "./ProductImage";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDescription(value: string | null): string {
  if (!value) {
    return "-";
  }

  return value;
}

export function CompareTable({
  products,
  onRemoveProduct,
}: {
  products: CompareProduct[];
  onRemoveProduct?: (id: number) => void;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/75 px-5 py-8 text-slate-600 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
        Select at least 2 products to compare them side by side.
      </div>
    );
  }

  const lowestPrice = Math.min(...products.map((product) => product.price));

  const attributes = [
    {
      label: "Image",
      value: (product: CompareProduct) => {
        const imageUrl =
          product.image_url ||
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80";

        return (
          <div className="flex items-center justify-center rounded-2xl bg-slate-100 p-2">
            <ProductImage
              src={imageUrl}
              alt={product.name}
              className="h-28 w-full max-w-44 rounded-xl object-cover"
            />
          </div>
        );
      },
    },
    {
      label: "Name",
      value: (product: CompareProduct) => product.name,
    },
    {
      label: "Price",
      value: (product: CompareProduct) => (
        <span
          className={
            product.price === lowestPrice
              ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800"
              : "font-medium text-slate-700"
          }
        >
          {formatPrice(product.price)}
        </span>
      ),
    },
    {
      label: "Store name",
      value: (product: CompareProduct) => product.store?.name ?? "-",
    },
    {
      label: "Rating",
      value: (product: CompareProduct) => (
        <StarRatingDisplay
          rating={product.average_rating ?? 0}
          count={product.review_count ?? 0}
          size="sm"
        />
      ),
    },
    {
      label: "Stock",
      value: (product: CompareProduct) =>
        (product.stock_quantity ?? 0) > 0 ? "In stock" : "Out of stock",
    },
    {
      label: "Category",
      value: (product: CompareProduct) => product.category?.name ?? "-",
    },
    {
      label: "Description",
      value: (product: CompareProduct) =>
        formatDescription(product.description),
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white/80 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-950 text-white">
              <th className="sticky left-0 bg-slate-950 px-5 py-4 text-left text-sm font-semibold uppercase tracking-[0.24em]">
                Attribute
              </th>
              {products.map((product) => (
                <th
                  key={product.id}
                  className="min-w-64 px-5 py-4 text-left text-sm font-semibold align-top"
                >
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
                        Selected product
                      </p>
                      <p className="mt-1 text-base font-semibold leading-6 text-white">
                        {product.name}
                      </p>
                    </div>
                    {onRemoveProduct ? (
                      <button
                        type="button"
                        onClick={() => onRemoveProduct(product.id)}
                        className="inline-flex rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white hover:bg-white/10"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attributes.map((attribute, rowIndex) => (
              <tr
                key={attribute.label}
                className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/80"}
              >
                <th className="sticky left-0 bg-inherit px-5 py-4 text-left text-sm font-semibold text-slate-700">
                  {attribute.label}
                </th>
                {products.map((product) => (
                  <td
                    key={`${attribute.label}-${product.id}`}
                    className="px-5 py-4 align-top text-sm text-slate-600"
                  >
                    {attribute.value(product)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
