"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchProductDetail,
  fetchRelatedOffers,
} from "@/services/catalog.service";
import type { Product } from "@/types/catalog";
import { fetchProductReviews, upsertReview } from "@/services/review.service";
import type { ReviewSummary } from "@/types/review";
import { StarRatingDisplay } from "@/components/StarRating";
import { StarRatingInput } from "@/components/StarRatingInput";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyProfile } from "@/services/user.service";
import type { UserProfile } from "@/services/user.service";
import { useWishlist } from "@/components/WishlistProvider";
import { addToWishlist, removeFromWishlist } from "@/services/wishlist.service";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = Number(params?.id);
  const { user } = useAuth();
  const { setCount } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedOffers, setRelatedOffers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(
    null,
  );
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState<{
    rating: number;
    comment: string;
  } | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    document.title = "Product Details | Aggregator Market";
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProfile(): Promise<void> {
      if (!user) {
        setProfile(null);
        return;
      }

      try {
        const nextProfile = await fetchMyProfile();
        if (active) {
          setProfile(nextProfile);
        }
      } catch {
        if (active) {
          setProfile(null);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    let active = true;

    async function loadProduct(): Promise<void> {
      if (Number.isNaN(productId)) {
        setError("Invalid product id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetchProductDetail(productId);
        const data = response.product;

        if (!active) {
          return;
        }
        console.log("Fetched product detail:", response);
        setProduct(data);

        try {
          const offers = await fetchRelatedOffers(data.id);

          if (active) {
            setRelatedOffers(offers.slice(0, 3));
          }
        } catch {
          if (active) setRelatedOffers([]);
        }
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Failed to load product details",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    let active = true;

    async function loadReviews(): Promise<void> {
      if (Number.isNaN(productId)) {
        return;
      }

      setReviewLoading(true);
      setReviewError(null);

      try {
        const summary = await fetchProductReviews(productId);
        if (active) {
          setReviewSummary(summary);
        }
      } catch (err) {
        if (active) {
          setReviewError(
            err instanceof Error ? err.message : "Failed to load reviews",
          );
        }
      } finally {
        if (active) {
          setReviewLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, [productId]);

  async function handleReviewSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setReviewError(null);

    if (!product) {
      return;
    }

    if (product.source === "api") {
      setReviewError("Reviews are disabled for API-imported products.");
      return;
    }

    if (currentRating < 1 || currentRating > 5) {
      setReviewError("Please select a rating between 1 and 5.");
      return;
    }

    try {
      await upsertReview({
        product_id: product.id,
        rating: currentRating,
        comment: currentComment.trim() || undefined,
      });

      const summary = await fetchProductReviews(product.id);
      setReviewSummary(summary);
      setReviewDraft(null);
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Failed to submit review",
      );
    }
  }

  async function handleToggleWishlist(): Promise<void> {
    if (!product) {
      return;
    }

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setWishlistLoading(true);
    const nextWishlisted = !product.is_wishlisted;
    setProduct({ ...product, is_wishlisted: nextWishlisted });

    try {
      if (nextWishlisted) {
        await addToWishlist(product.id);
        setCount((prev) => prev + 1);
      } else {
        await removeFromWishlist(product.id);
        setCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      setProduct({ ...product, is_wishlisted: !nextWishlisted });
      setError(
        err instanceof Error ? err.message : "Failed to update wishlist",
      );
    } finally {
      setWishlistLoading(false);
    }
  }

  const ratingValue = reviewSummary?.average_rating ?? product?.average_rating;
  const ratingCount = reviewSummary?.review_count ?? product?.review_count;
  const ratingSource =
    reviewSummary?.rating_source ?? product?.rating_source ?? "internal";
  const existingReview =
    profile && reviewSummary
      ? reviewSummary.reviews.find((review) => review.user_id === profile.id)
      : null;
  const currentRating = reviewDraft?.rating ?? existingReview?.rating ?? 0;
  const currentComment = reviewDraft?.comment ?? existingReview?.comment ?? "";

  return (
    <section className="space-y-6">
      <button
        type="button"
        onClick={() => router.push("/products")}
        className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-700 hover:text-emerald-800"
      >
        Back to products
      </button>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-96 animate-pulse rounded-4xl border border-black/10 bg-white/70" />
          <div className="space-y-4">
            <div className="h-56 animate-pulse rounded-4xl border border-black/10 bg-white/70" />
            <div className="h-56 animate-pulse rounded-4xl border border-black/10 bg-white/70" />
          </div>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : product ? (
        <div className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="overflow-hidden rounded-4xl border border-black/10 bg-white/80 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
              <div className="aspect-4/3 bg-slate-100">
                <img
                  src={
                    product.image_url ||
                    "https://images.unsplash.com/photo-1513708927688-89046b44c3f9?auto=format&fit=crop&w=1400&q=80"
                  }
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-5 rounded-4xl border border-black/10 bg-white/80 p-7 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  {product.category?.name ?? ""}
                </p>
                <h1 className="display-font text-4xl font-semibold text-slate-950">
                  {product.name}
                </h1>
              </div>
              <p className="text-base leading-7 text-slate-600">
                {product.description ||
                  "No description was provided for this item."}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                  {formatPrice(product.price)}
                </span>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  Sold by {product.store?.name ?? "Unknown"}
                </span>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 transition hover:border-emerald-600 ${
                    product.is_wishlisted ? "text-rose-600" : ""
                  } ${wishlistLoading ? "opacity-60" : ""}`}
                  aria-label={
                    product.is_wishlisted
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                      fill={product.is_wishlisted ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StarRatingDisplay
                  rating={ratingValue ?? 0}
                  count={ratingCount ?? 0}
                  size="md"
                />
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {ratingSource === "external"
                    ? "External rating"
                    : "Community rating"}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-black/10 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Category
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {product.category?.name ?? ""}
                  </p>
                </div>
                <div className="rounded-3xl border border-black/10 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Store
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {product.store?.name ?? ""}
                  </p>
                </div>
                <div className="rounded-3xl border border-black/10 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Created at
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatDate(product.created_at)}
                  </p>
                </div>
                <div className="rounded-3xl border border-black/10 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Product url
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-950">
                    {product.product_url ?? "Not available"}
                  </p>
                </div>
              </div>

              {product.product_url ? (
                <a
                  href={product.product_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Go to Store
                </a>
              ) : (
                <span className="inline-flex w-fit items-center justify-center rounded-full bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500">
                  No store link available
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-4xl border border-black/10 bg-white/80 p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Endpoint
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                GET /api/products/{product.id}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This view now reads the exact product detail payload returned by
                the backend route, including the nested category and store data
                used by the API.
              </p>
            </div>

            <div className="rounded-4xl border border-black/10 bg-white/80 p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Store
              </p>
              <h2 className="mt-2 display-font text-2xl font-semibold text-slate-950">
                {product.store?.name ?? ""}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The backend exposes this as the product&apos;s live store name,
                so the page can present the same identity that comes back from
                the API.
              </p>
            </div>
          </div>

          <div className="space-y-6 rounded-4xl border border-black/10 bg-white/80 p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Ratings & Reviews
                </p>
                <h2 className="mt-2 display-font text-2xl font-semibold text-slate-950">
                  What people think
                </h2>
              </div>
              <StarRatingDisplay
                rating={ratingValue ?? 0}
                count={ratingCount ?? 0}
                size="md"
              />
            </div>

            {ratingSource === "external" ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Ratings are imported from the external vendor source.
              </div>
            ) : null}

            {reviewError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {reviewError}
              </div>
            ) : null}

            {ratingSource === "internal" ? (
              <div className="space-y-4 rounded-3xl border border-black/10 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-800">
                  {currentRating > 0
                    ? "Update your review"
                    : "Share your review"}
                </h3>

                {!user ? (
                  <p className="text-sm text-slate-600">
                    Sign in to leave a rating and review.
                  </p>
                ) : (
                  <form className="space-y-4" onSubmit={handleReviewSubmit}>
                    <StarRatingInput
                      value={currentRating}
                      onChange={(next) =>
                        setReviewDraft({
                          rating: next,
                          comment: currentComment,
                        })
                      }
                      disabled={!user}
                    />
                    <textarea
                      value={currentComment}
                      onChange={(event) =>
                        setReviewDraft({
                          rating: currentRating,
                          comment: event.target.value,
                        })
                      }
                      placeholder="Tell us what you liked or disliked"
                      className="min-h-30 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none"
                      maxLength={2000}
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Submit review
                    </button>
                  </form>
                )}
              </div>
            ) : null}

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Reviews</h3>

              {reviewLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-20 animate-pulse rounded-3xl border border-black/10 bg-white"
                    />
                  ))}
                </div>
              ) : reviewSummary?.reviews?.length ? (
                <div className="space-y-4">
                  {reviewSummary.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-3xl border border-black/10 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {review.user.full_name || review.user.email}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(review.created_at)}
                          </p>
                        </div>
                        <StarRatingDisplay rating={review.rating} />
                      </div>
                      {review.comment ? (
                        <p className="mt-3 text-sm text-slate-600">
                          {review.comment}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No reviews yet. Be the first to share your experience.
                </p>
              )}
            </div>
          </div>

          {relatedOffers.length > 0 ? (
            <div className="space-y-4 rounded-4xl border border-black/10 bg-white/80 p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Available from other stores
                </p>
                <h2 className="mt-2 display-font text-2xl font-semibold text-slate-950">
                  Compare prices for this item
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {relatedOffers.map((item) => (
                  <Link
                    key={item.id}
                    href={`/products/${item.id}`}
                    className="rounded-3xl border border-black/10 bg-slate-50 p-4 transition hover:-translate-y-1 hover:bg-white"
                  >
                    <p className="text-sm font-semibold text-slate-950">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.store?.name ?? ""}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-emerald-700">
                      {formatPrice(item.price)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
