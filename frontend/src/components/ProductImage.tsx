"use client";

import { useState } from "react";

/**
 * Product thumbnail with an honest fallback.
 *
 * When a product has no image (or the URL fails to load) we render a neutral,
 * branded placeholder instead of a stock photo — a misleading stock image makes
 * empty products look like real, identical listings.
 */
export function ProductImage({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;

  if (showPlaceholder) {
    return (
      <div
        role="img"
        aria-label={`${alt} — no image available`}
        className={`flex items-center justify-center bg-linear-to-br from-emerald-50 to-slate-100 text-emerald-700/60 ${className}`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-10 w-10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
