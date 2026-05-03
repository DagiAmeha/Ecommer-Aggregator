import { pool } from "../../config/db";

export type StoreSourceType = "api" | "manual";

export interface StoreSource {
  id: number;
  store_id: number;
  type: StoreSourceType;
  url: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateStoreSourceInput {
  store_id: number;
  type: StoreSourceType;
  url: string;
  is_active?: boolean;
}

export async function findStoreSourceByStoreAndUrl(
  storeId: number,
  type: StoreSourceType,
  url: string,
): Promise<StoreSource | null> {
  const result = await pool.query<StoreSource>(
    `
      SELECT id, store_id, type, url, is_active, created_at::text AS created_at
      FROM store_sources
      WHERE store_id = $1 AND type = $2 AND url = $3
      LIMIT 1
    `,
    [storeId, type, url],
  );

  return result.rows[0] ?? null;
}

export async function createStoreSource(
  data: CreateStoreSourceInput,
): Promise<StoreSource> {
  const result = await pool.query<StoreSource>(
    `
      INSERT INTO store_sources (store_id, type, url, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING id, store_id, type, url, is_active, created_at::text AS created_at
    `,
    [data.store_id, data.type, data.url, data.is_active ?? true],
  );

  return result.rows[0];
}

export async function activateStoreSource(
  id: number,
): Promise<StoreSource | null> {
  const result = await pool.query<StoreSource>(
    `
      UPDATE store_sources
      SET is_active = true
      WHERE id = $1
      RETURNING id, store_id, type, url, is_active, created_at::text AS created_at
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function findActiveApiSources(): Promise<StoreSource[]> {
  const result = await pool.query<StoreSource>(
    `
      SELECT id, store_id, type, url, is_active, created_at::text AS created_at
      FROM store_sources
      WHERE type = 'api' AND is_active = true
      ORDER BY id ASC
    `,
  );

  return result.rows;
}
