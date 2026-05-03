"use client";

export function SearchBar({
  initialValue = "",
  onSearch,
  loading = false,
}: {
  initialValue?: string;
  onSearch: (value: string) => void;
  loading?: boolean;
}) {
  return (
    <form
      className="flex flex-col gap-3 rounded-3xl border border-black/10 bg-white/75 p-4 shadow-[0_16px_50px_rgba(16,35,30,0.08)] sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSearch(String(formData.get("search") ?? "").trim());
      }}
    >
      <input
        name="search"
        defaultValue={initialValue}
        type="search"
        placeholder="Search products, stores, or descriptions"
        className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </form>
  );
}