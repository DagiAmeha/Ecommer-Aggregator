import { pool } from "../../config/db";
import {
  mapProductRow,
  Product,
  ProductRow,
} from "../product/product.model";

export type ProductEventType = "view" | "click" | "search";

export async function recordProductEvent(input: {
  event_type: ProductEventType;
  product_id?: number;
  user_id?: number;
  search_query?: string;
}): Promise<void> {
  await pool.query(
    `
      INSERT INTO product_events (event_type, product_id, user_id, search_query)
      VALUES ($1, $2, $3, $4)
    `,
    [
      input.event_type,
      input.product_id ?? null,
      input.user_id ?? null,
      input.search_query ?? null,
    ],
  );
}

const TRENDING_PRODUCT_SELECT = `
  SELECT
    p.id,
    p.name,
    p.description,
    p.price::float8 AS price,
    p.image_url,
    p.product_url,
    p.created_at::text AS created_at,
    p.updated_at::text AS updated_at,
    p.last_synced_at::text AS last_synced_at,
    p.source,
    p.external_id,
    p.stock_quantity::int AS stock_quantity,
    p.external_rating_rate,
    p.external_rating_count,
    CASE
      WHEN p.source = 'api' THEN COALESCE(p.external_rating_rate, 0)
      ELSE COALESCE(r.avg_rating, 0)
    END AS average_rating,
    CASE
      WHEN p.source = 'api' THEN COALESCE(p.external_rating_count, 0)
      ELSE COALESCE(r.review_count, 0)
    END AS review_count,
    CASE
      WHEN p.source = 'api' THEN 'external'
      ELSE 'internal'
    END AS rating_source,
    false AS is_wishlisted,
    c.id AS category_id,
    c.name AS category_name,
    s.id AS store_id,
    s.store_name AS store_name,
    COUNT(e.id)::int AS event_count
  FROM product_events e
  JOIN products p ON p.id = e.product_id
  JOIN categories c ON c.id = p.category_id
  JOIN stores s ON s.id = p.store_id
  LEFT JOIN (
    SELECT product_id, AVG(rating)::float8 AS avg_rating, COUNT(*)::int AS review_count
    FROM reviews
    GROUP BY product_id
  ) r ON r.product_id = p.id
  WHERE e.event_type IN ('view', 'click')
    AND e.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY p.id, c.id, c.name, s.id, s.store_name, r.avg_rating, r.review_count
  ORDER BY event_count DESC, p.created_at DESC
  LIMIT $1
`;

export async function getTrendingProducts(limit = 8): Promise<Product[]> {
  const result = await pool.query<ProductRow>(TRENDING_PRODUCT_SELECT, [limit]);
  return result.rows.map(mapProductRow);
}

export async function getRecommendations(
  productId?: number,
  limit = 8,
): Promise<Product[]> {
  if (productId) {
    const seed = await pool.query<{ category_id: number }>(
      `SELECT category_id FROM products WHERE id = $1`,
      [productId],
    );
    const categoryId = seed.rows[0]?.category_id;

    if (categoryId) {
      const result = await pool.query<ProductRow>(
        `
          SELECT
            p.id, p.name, p.description, p.price::float8 AS price,
            p.image_url, p.product_url,
            p.created_at::text AS created_at,
            p.updated_at::text AS updated_at,
            p.last_synced_at::text AS last_synced_at,
            p.source, p.external_id,
            p.stock_quantity::int AS stock_quantity,
            p.external_rating_rate, p.external_rating_count,
            CASE WHEN p.source = 'api' THEN COALESCE(p.external_rating_rate, 0)
                 ELSE COALESCE(r.avg_rating, 0) END AS average_rating,
            CASE WHEN p.source = 'api' THEN COALESCE(p.external_rating_count, 0)
                 ELSE COALESCE(r.review_count, 0) END AS review_count,
            CASE WHEN p.source = 'api' THEN 'external' ELSE 'internal' END AS rating_source,
            false AS is_wishlisted,
            c.id AS category_id, c.name AS category_name,
            s.id AS store_id, s.store_name AS store_name
          FROM products p
          JOIN categories c ON c.id = p.category_id
          JOIN stores s ON s.id = p.store_id
          LEFT JOIN (
            SELECT product_id, AVG(rating)::float8 AS avg_rating, COUNT(*)::int AS review_count
            FROM reviews GROUP BY product_id
          ) r ON r.product_id = p.id
          WHERE p.category_id = $1 AND p.id <> $2
          ORDER BY p.created_at DESC
          LIMIT $3
        `,
        [categoryId, productId, limit],
      );

      if (result.rows.length > 0) {
        return result.rows.map(mapProductRow);
      }
    }
  }

  return getTrendingProducts(limit);
}

export async function getTopSearchQueries(limit = 10): Promise<
  Array<{ query: string; count: number }>
> {
  const result = await pool.query<{ query: string; count: string }>(
    `
      SELECT search_query AS query, COUNT(*)::text AS count
      FROM product_events
      WHERE event_type = 'search'
        AND search_query IS NOT NULL
        AND search_query <> ''
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY search_query
      ORDER BY COUNT(*) DESC
      LIMIT $1
    `,
    [limit],
  );

  return result.rows.map((row) => ({
    query: row.query,
    count: Number(row.count),
  }));
}

export async function getVendorPerformanceStats(storeId: number): Promise<{
  total_views: number;
  total_clicks: number;
  low_stock_products: number;
}> {
  const result = await pool.query<{
    total_views: string;
    total_clicks: string;
    low_stock_products: string;
  }>(
    `
      SELECT
        (
          SELECT COUNT(*)::text
          FROM product_events e
          JOIN products p ON p.id = e.product_id
          WHERE p.store_id = $1 AND e.event_type = 'view'
        ) AS total_views,
        (
          SELECT COUNT(*)::text
          FROM product_events e
          JOIN products p ON p.id = e.product_id
          WHERE p.store_id = $1 AND e.event_type = 'click'
        ) AS total_clicks,
        (
          SELECT COUNT(*)::text
          FROM products
          WHERE store_id = $1 AND stock_quantity <= 0
        ) AS low_stock_products
    `,
    [storeId],
  );

  const row = result.rows[0];
  return {
    total_views: Number(row?.total_views ?? 0),
    total_clicks: Number(row?.total_clicks ?? 0),
    low_stock_products: Number(row?.low_stock_products ?? 0),
  };
}
