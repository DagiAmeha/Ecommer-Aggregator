"use client";

export default function VendorStoreSettingsPage() {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
        Store Settings
      </p>
      <h2 className="mt-3 text-xl font-semibold text-slate-950">
        Store profile management
      </h2>
      <p className="mt-3 text-sm text-slate-600">
        This section will let you update store details and ingestion sources.
        Hook it up when the store settings API is ready.
      </p>
    </div>
  );
}
