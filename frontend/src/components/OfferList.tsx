import type { Offer } from "@/types/catalog";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function OfferList({ offers }: { offers: Offer[] }) {
  if (offers.length === 0) {
    return (
      <div className="rounded-3xl border border-black/10 bg-white/75 px-5 py-8 text-slate-600 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        No offers were returned for this product.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <div
          key={offer.id}
          className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white/80 p-5 shadow-[0_16px_50px_rgba(16,35,30,0.08)] sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Store
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">
              {offer.storeName}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Offer price from store #{offer.storeId}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-2xl font-semibold text-emerald-700">
              {formatPrice(offer.price)}
            </p>
            <a
              href={offer.url ?? "#"}
              target={offer.url ? "_blank" : undefined}
              rel={offer.url ? "noreferrer" : undefined}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Go to Store
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}