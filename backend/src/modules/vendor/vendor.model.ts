import { pool } from "../../config/db";
import {
  getCategoryById,
  mapProductRow,
  Product,
  ProductRow,
} from "../product/product.model";
import { handleProductPriceChange } from "../price/priceMonitor.service";

const REVIEW_AGG_JOIN = `
  LEFT JOIN (
    SELECT
      product_id,
      AVG(rating)::float8 AS avg_rating,
      COUNT(*)::int AS review_count
    FROM reviews
    GROUP BY product_id
  ) r ON r.product_id = p.id
`;

const RATING_SELECT_FIELDS = `
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
  END AS rating_source
`;

const WISHLIST_SELECT_FIELD = "false AS is_wishlisted";

export interface VendorProductInput {
  name: string;
  description?: string;
  price: number;
  stock_quantity?: number;
  category_id: number;
  image_url?: string;
  product_url?: string;
}

export async function findVendorProducts(
  storeId: number,
  page: number,
  limit: number,
): Promise<{ rows: Product[]; total: number }> {
  const offset = (page - 1) * limit;

  const countResult = await pool.query<{ total: string }>(
    `
      SELECT COUNT(*) AS total
      FROM products
      WHERE store_id = $1
    `,
    [storeId],
  );

  const total = Number(countResult.rows[0]?.total ?? 0);

  const result = await pool.query<ProductRow>(
    `
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
        ${RATING_SELECT_FIELDS},
        ${WISHLIST_SELECT_FIELD},
        c.id AS category_id,
        c.name AS category_name,
        s.id AS store_id,
        s.store_name AS store_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN stores s ON s.id = p.store_id
      ${REVIEW_AGG_JOIN}
      WHERE p.store_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [storeId, limit, offset],
  );

  return { rows: result.rows.map(mapProductRow), total };
}

export async function findVendorProductById(
  storeId: number,
  productId: number,
): Promise<Product | null> {
  const result = await pool.query<ProductRow>(
    `
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
        ${RATING_SELECT_FIELDS},
        ${WISHLIST_SELECT_FIELD},
        c.id AS category_id,
        c.name AS category_name,
        s.id AS store_id,
        s.store_name AS store_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN stores s ON s.id = p.store_id
      ${REVIEW_AGG_JOIN}
      WHERE p.store_id = $1 AND p.id = $2
      LIMIT 1
    `,
    [storeId, productId],
  );

  return result.rows[0] ? mapProductRow(result.rows[0]) : null;
}

export async function createVendorProduct(
  storeId: number,
  payload: VendorProductInput,
): Promise<Product> {
  const category = await getCategoryById(payload.category_id);

  if (!category) {
    throw new Error("Category not found");
  }

  const insertResult = await pool.query<{ id: number }>(
    `
      INSERT INTO products (
        name,
        description,
        price,
        stock_quantity,
        category_id,
        store_id,
        image_url,
        product_url,
        source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'manual')
      RETURNING id
    `,
    [
      payload.name,
      payload.description ?? null,
      payload.price,
      payload.stock_quantity ?? 0,
      payload.category_id,
      storeId,
      payload.image_url ?? null,
      payload.product_url ?? null,
    ],
  );

  const created = await findVendorProductById(storeId, insertResult.rows[0].id);

  if (!created) {
    throw new Error("Failed to load created product");
  }

  return created;
}

export async function updateVendorProduct(
  storeId: number,
  productId: number,
  payload: Partial<VendorProductInput>,
): Promise<Product | null> {
  const existing = await findVendorProductById(storeId, productId);
  if (!existing) {
    return null;
  }

  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  if (typeof payload.name !== "undefined") {
    fields.push(`name = $${fields.length + 1}`);
    values.push(payload.name);
  }

  if (typeof payload.description !== "undefined") {
    fields.push(`description = $${fields.length + 1}`);
    values.push(payload.description ?? null);
  }

  if (typeof payload.price !== "undefined") {
    fields.push(`price = $${fields.length + 1}`);
    values.push(payload.price);
  }

  if (typeof payload.stock_quantity !== "undefined") {
    fields.push(`stock_quantity = $${fields.length + 1}`);
    values.push(payload.stock_quantity);
  }

  if (typeof payload.category_id !== "undefined") {
    const category = await getCategoryById(payload.category_id);

    if (!category) {
      throw new Error("Category not found");
    }

    fields.push(`category_id = $${fields.length + 1}`);
    values.push(payload.category_id);
  }

  if (typeof payload.image_url !== "undefined") {
    fields.push(`image_url = $${fields.length + 1}`);
    values.push(payload.image_url ?? null);
  }

  if (typeof payload.product_url !== "undefined") {
    fields.push(`product_url = $${fields.length + 1}`);
    values.push(payload.product_url ?? null);
  }

  if (fields.length === 0) {
    return findVendorProductById(storeId, productId);
  }

  fields.push(`updated_at = NOW()`);

  values.push(storeId, productId);

  const result = await pool.query<{ id: number }>(
    `
      UPDATE products
      SET ${fields.join(", ")}
      WHERE store_id = $${values.length - 1} AND id = $${values.length}
      RETURNING id
    `,
    values,
  );

  const updatedId = result.rows[0]?.id;
  if (!updatedId) {
    return null;
  }

  const updated = await findVendorProductById(storeId, updatedId);
  if (updated && typeof payload.price !== "undefined") {
    await handleProductPriceChange(
      updated.id,
      updated.name,
      existing.price,
      updated.price,
    );
  }

  return updated;
}

export async function deleteVendorProduct(
  storeId: number,
  productId: number,
): Promise<boolean> {
  const result = await pool.query(
    `
      DELETE FROM products
      WHERE store_id = $1 AND id = $2
    `,
    [storeId, productId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function getVendorDashboardStats(
  storeId: number,
  latestLimit: number,
): Promise<{
  total_products: number;
  total_categories: number;
  total_views: number;
  total_clicks: number;
  low_stock_products: number;
  latest_products: Product[];
}> {
  const totals = await pool.query<{
    total_products: string;
    total_categories: string;
    total_views: string;
    total_clicks: string;
    low_stock_products: string;
  }>(
    `
      SELECT
        COUNT(*)::text AS total_products,
        COUNT(DISTINCT category_id)::text AS total_categories,
        (
          SELECT COUNT(*)::text
          FROM product_events e
          JOIN products p2 ON p2.id = e.product_id
          WHERE p2.store_id = $1 AND e.event_type = 'view'
        ) AS total_views,
        (
          SELECT COUNT(*)::text
          FROM product_events e
          JOIN products p2 ON p2.id = e.product_id
          WHERE p2.store_id = $1 AND e.event_type = 'click'
        ) AS total_clicks,
        SUM(CASE WHEN stock_quantity <= 0 THEN 1 ELSE 0 END)::text AS low_stock_products
      FROM products
      WHERE store_id = $1
    `,
    [storeId],
  );

  const latestResult = await pool.query<ProductRow>(
    `
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
        ${RATING_SELECT_FIELDS},
        ${WISHLIST_SELECT_FIELD},
        c.id AS category_id,
        c.name AS category_name,
        s.id AS store_id,
        s.store_name AS store_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN stores s ON s.id = p.store_id
      ${REVIEW_AGG_JOIN}
      WHERE p.store_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2
    `,
    [storeId, latestLimit],
  );

  return {
    total_products: Number(totals.rows[0]?.total_products ?? 0),
    total_categories: Number(totals.rows[0]?.total_categories ?? 0),
    total_views: Number(totals.rows[0]?.total_views ?? 0),
    total_clicks: Number(totals.rows[0]?.total_clicks ?? 0),
    low_stock_products: Number(totals.rows[0]?.low_stock_products ?? 0),
    latest_products: latestResult.rows.map(mapProductRow),
  };
}
