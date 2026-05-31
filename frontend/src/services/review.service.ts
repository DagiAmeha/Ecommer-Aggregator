import { apiRequest } from "./api";
import type { Review, ReviewInput, ReviewSummary } from "@/types/review";

export async function fetchProductReviews(
  productId: number,
): Promise<ReviewSummary> {
  return apiRequest<ReviewSummary>(`/reviews/product/${productId}`);
}

export async function upsertReview(
  payload: ReviewInput,
): Promise<{ review: Review }> {
  return apiRequest<{ review: Review }>("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteReview(reviewId: number): Promise<void> {
  await apiRequest<{ deleted: boolean }>(`/reviews/${reviewId}`, {
    method: "DELETE",
  });
}
