import { pool } from "../../config/db";
import { createStoreSource, StoreSourceType } from "./store_source.model";

export interface Store {
  id: number;
  owner_id: number;
  store_name: string;
  description: string | null;
  is_active: boolean;
  logo_url?: string | null;
  website_url?: string | null;
  location?: string | null;
}

export interface StoreCategory {
  id: number;
  name: string;
}

export interface StoreStats {
  total_products: number;
  average_rating: number;
  lowest_price: number | null;
  highest_price: number | null;
  categories: StoreCategory[];
}

export interface StorePublicProfile {
  store: Store;
  stats: StoreStats;
}

export interface RelatedStore {
  id: number;
  store_name: string;
  description: string | null;
  logo_url: string | null;
  product_count: number;
}

export interface CreateStoreInput {
  owner_id: number;
  store_name: string;
  description?: string;
  is_active?: boolean;
  source_type?: StoreSourceType;
  url?: string;
}

export interface UpdateStoreInput {
  store_name?: string;
  description?: string | null;
  is_active?: boolean;
}

export async function createStoreRecord(
  data: CreateStoreInput,
): Promise<Store> {
  const result = await pool.query<Store>(
    `
      INSERT INTO stores (owner_id, store_name, description, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING id, owner_id, store_name, description, is_active
    `,
    [
      data.owner_id,
      data.store_name,
      data.description ?? null,
      data.is_active ?? true,
    ],
  );

  if (
    (data.source_type === "api" || data.source_type === "scraping") &&
    data.url
  ) {
    await createStoreSource({
      store_id: result.rows[0].id,
      type: data.source_type,
      url: data.url,
      is_active: true,
    });
  }

  return result.rows[0];
}

export async function findAllStores(): Promise<Store[]> {
  const result = await pool.query<Store>(
    `
      SELECT id, owner_id, store_name, description, is_active
      FROM stores
      ORDER BY store_name ASC
    `,
  );
  return result.rows;
}

export async function findStoreById(id: number): Promise<Store | null> {
  const result = await pool.query<Store>(
    `
      SELECT id, owner_id, store_name, description, is_active
      FROM stores
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function findStoreByOwnerId(
  ownerId: number,
): Promise<Store | null> {
  const result = await pool.query<Store>(
    `
      SELECT id, owner_id, store_name, description, is_active
      FROM stores
      WHERE owner_id = $1
      LIMIT 1
    `,
    [ownerId],
  );

  return result.rows[0] ?? null;
}

export async function updateStoreById(
  id: number,
  data: UpdateStoreInput,
): Promise<Store | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (typeof data.store_name !== "undefined") {
    fields.push(`store_name = $${fields.length + 1}`);
    values.push(data.store_name);
  }

  if (typeof data.description !== "undefined") {
    fields.push(`description = $${fields.length + 1}`);
    values.push(data.description ?? null);
  }

  if (typeof data.is_active !== "undefined") {
    fields.push(`is_active = $${fields.length + 1}`);
    values.push(data.is_active);
  }

  if (fields.length === 0) {
    return findStoreById(id);
  }

  values.push(id);

  const result = await pool.query<Store>(
    `UPDATE stores SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING id, owner_id, store_name, description, is_active`,
    values,
  );

  return result.rows[0] ?? null;
}

export async function deleteStoreById(id: number): Promise<boolean> {
  const result = await pool.query(
    `
      DELETE FROM stores
      WHERE id = $1
    `,
    [id],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function findStorePublicProfile(
  id: number,
): Promise<StorePublicProfile | null> {
  // Fetch the store itself (with optional profile columns)
  const storeResult = await pool.query<Store>(
    `
      SELECT
        id, owner_id, store_name, description, is_active,
        logo_url, website_url, location
      FROM stores
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  const store = storeResult.rows[0];
  if (!store) {
    return null;
  }

  // Aggregate product stats for this store
  const statsResult = await pool.query<{
    total_products: string;
    average_rating: string;
    lowest_price: string | null;
    highest_price: string | null;
  }>(
    `
      SELECT
        COUNT(*)::text AS total_products,
        COALESCE(
          AVG(
            CASE
              WHEN p.source IN ('api', 'scraping') THEN p.external_rating_rate
              ELSE (
                SELECT AVG(r.rating)::float8
                FROM reviews r
                WHERE r.product_id = p.id
              )
            END
          ),
          0
        )::text AS average_rating,
        MIN(p.price)::text AS lowest_price,
        MAX(p.price)::text AS highest_price
      FROM products p
      WHERE p.store_id = $1
    `,
    [id],
  );

  const statsRow = statsResult.rows[0];

  // Fetch distinct categories for products in this store
  const categoriesResult = await pool.query<StoreCategory>(
    `
      SELECT DISTINCT c.id, c.name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.store_id = $1
      ORDER BY c.name ASC
    `,
    [id],
  );

  return {
    store,
    stats: {
      total_products: Number(statsRow?.total_products ?? 0),
      average_rating:
        Math.round(Number(statsRow?.average_rating ?? 0) * 10) / 10,
      lowest_price: statsRow?.lowest_price
        ? Number(statsRow.lowest_price)
        : null,
      highest_price: statsRow?.highest_price
        ? Number(statsRow.highest_price)
        : null,
      categories: categoriesResult.rows,
    },
  };
}

export async function findRelatedStores(
  storeId: number,
  categoryIds: number[],
  limit = 4,
): Promise<RelatedStore[]> {
  if (categoryIds.length === 0) {
    return [];
  }

  const result = await pool.query<RelatedStore>(
    `
      SELECT
        s.id,
        s.store_name,
        s.description,
        s.logo_url,
        COUNT(DISTINCT p.id)::int AS product_count
      FROM stores s
      JOIN products p ON p.store_id = s.id
      WHERE s.id <> $1
        AND s.is_active = true
        AND p.category_id = ANY($2::int[])
      GROUP BY s.id, s.store_name, s.description, s.logo_url
      ORDER BY product_count DESC
      LIMIT $3
    `,
    [storeId, categoryIds, limit],
  );

  return result.rows;
}
