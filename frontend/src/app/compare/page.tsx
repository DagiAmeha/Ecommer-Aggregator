import { Suspense } from "react";
import CompareClient from "./CompareClient";

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="h-[360px] animate-pulse rounded-3xl border border-black/10 bg-white/70" />
      }
    >
      <CompareClient />
    </Suspense>
  );
}
