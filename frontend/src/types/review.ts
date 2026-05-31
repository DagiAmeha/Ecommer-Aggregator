import type { RatingSource } from "./catalog";

export interface ReviewUser {
  id: number;
  full_name: string | null;
  email: string;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  user: ReviewUser;
}

export interface ReviewSummary {
  reviews: Review[];
  average_rating: number;
  review_count: number;
  rating_source: RatingSource;
}

export interface ReviewInput {
  product_id: number;
  rating: number;
  comment?: string;
}
