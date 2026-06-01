import { Suspense } from "react";
import CompareClient from "./CompareClient";

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="h-[360px] animate-pulse rounded-2xl border border-black/10 bg-slate-200/70 dark:bg-white/5" />
      }
    >
      <CompareClient />
    </Suspense>
  );
}
