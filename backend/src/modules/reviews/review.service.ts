import { pool } from "../../config/db";
import {
  findProductById,
  RatingSource,
  Product,
} from "../product/product.model";

export interface ReviewUser {
  id: number;
  full_name: string | null;
  email: string;
}

export interface ReviewWithUser {
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
  reviews: ReviewWithUser[];
  average_rating: number;
  review_count: number;
  rating_source: RatingSource;
}

async function loadProduct(productId: number): Promise<Product | null> {
  return findProductById(productId);
}

async function loadReviewWithUser(reviewId: number): Promise<ReviewWithUser> {
  const result = await pool.query<ReviewWithUser & ReviewUser>(
    `
      SELECT
        r.id,
        r.product_id,
        r.user_id,
        r.rating,
        r.comment,
        r.created_at::text AS created_at,
        r.updated_at::text AS updated_at,
        u.full_name,
        u.email
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.id = $1
      LIMIT 1
    `,
    [reviewId],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Review not found");
  }

  return {
    id: row.id,
    product_id: row.product_id,
    user_id: row.user_id,
    rating: row.rating,
    comment: row.comment ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    user: {
      id: row.user_id,
      full_name: row.full_name ?? null,
      email: row.email,
    },
  };
}

export async function upsertReview(
  userId: number,
  payload: { product_id: number; rating: number; comment?: string },
): Promise<ReviewWithUser> {
  const result = await pool.query<{ id: number }>(
    `
      INSERT INTO reviews (product_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (product_id, user_id)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        updated_at = NOW()
      RETURNING id
    `,
    [payload.product_id, userId, payload.rating, payload.comment ?? null],
  );

  return loadReviewWithUser(result.rows[0].id);
}

export async function listReviewsForProduct(
  productId: number,
): Promise<ReviewSummary | null> {
  const product = await loadProduct(productId);

  if (!product) {
    return null;
  }

  if (product.source === "api") {
    return {
      reviews: [],
      average_rating: product.average_rating,
      review_count: product.review_count,
      rating_source: "external",
    };
  }

  const reviewsResult = await pool.query<ReviewWithUser & ReviewUser>(
    `
      SELECT
        r.id,
        r.product_id,
        r.user_id,
        r.rating,
        r.comment,
        r.created_at::text AS created_at,
        r.updated_at::text AS updated_at,
        u.full_name,
        u.email
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
    `,
    [productId],
  );

  const aggregateResult = await pool.query<{
    average_rating: number | null;
    review_count: number | null;
  }>(
    `
      SELECT
        AVG(rating)::float8 AS average_rating,
        COUNT(*)::int AS review_count
      FROM reviews
      WHERE product_id = $1
    `,
    [productId],
  );

  const aggregateRow = aggregateResult.rows[0];
  const reviews = reviewsResult.rows.map((row) => ({
    id: row.id,
    product_id: row.product_id,
    user_id: row.user_id,
    rating: row.rating,
    comment: row.comment ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    user: {
      id: row.user_id,
      full_name: row.full_name ?? null,
      email: row.email,
    },
  }));

  return {
    reviews,
    average_rating: aggregateRow?.average_rating ?? 0,
    review_count: aggregateRow?.review_count ?? 0,
    rating_source: "internal",
  };
}

export async function deleteReviewById(
  reviewId: number,
  userId: number,
): Promise<boolean> {
  const result = await pool.query(
    `
      DELETE FROM reviews
      WHERE id = $1 AND user_id = $2
    `,
    [reviewId, userId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function ensureManualProduct(productId: number): Promise<Product> {
  const product = await loadProduct(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  if (product.source === "api") {
    throw new Error("Reviews are disabled for API-imported products.");
  }

  return product;
}
