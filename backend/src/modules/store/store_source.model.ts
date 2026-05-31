import { pool } from "../../config/db";

export type StoreSourceType = "api" | "manual" | "scraping";

export type StoreSourceSyncStatus = "idle" | "success" | "partial" | "failed";

export interface StoreSource {
  id: number;
  store_id: number;
  type: StoreSourceType;
  url: string;
  is_active: boolean;
  source_name: string | null;
  last_sync_at: string | null;
  last_sync_status: StoreSourceSyncStatus | null;
  last_imported_count: number | null;
  last_updated_count: number | null;
  last_failed_count: number | null;
  created_at: string;
}

export interface CreateStoreSourceInput {
  store_id: number;
  type: StoreSourceType;
  url: string;
  is_active?: boolean;
  source_name?: string | null;
}

export async function findStoreSourceByStoreAndUrl(
  storeId: number,
  type: StoreSourceType,
  url: string,
): Promise<StoreSource | null> {
  const result = await pool.query<StoreSource>(
    `
      SELECT id, store_id, type, url, is_active, source_name,
        last_sync_at::text AS last_sync_at,
        last_sync_status,
        last_imported_count,
        last_updated_count,
        last_failed_count,
        created_at::text AS created_at
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
      INSERT INTO store_sources (store_id, type, url, is_active, source_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, store_id, type, url, is_active, source_name,
        last_sync_at::text AS last_sync_at,
        last_sync_status,
        last_imported_count,
        last_updated_count,
        last_failed_count,
        created_at::text AS created_at
    `,
    [
      data.store_id,
      data.type,
      data.url,
      data.is_active ?? true,
      data.source_name ?? null,
    ],
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
      RETURNING id, store_id, type, url, is_active, source_name,
        last_sync_at::text AS last_sync_at,
        last_sync_status,
        last_imported_count,
        last_updated_count,
        last_failed_count,
        created_at::text AS created_at
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function findActiveApiSources(): Promise<StoreSource[]> {
  const result = await pool.query<StoreSource>(
    `
      SELECT id, store_id, type, url, is_active, source_name,
        last_sync_at::text AS last_sync_at,
        last_sync_status,
        last_imported_count,
        last_updated_count,
        last_failed_count,
        created_at::text AS created_at
      FROM store_sources
      WHERE type = 'api' AND is_active = true
      ORDER BY id ASC
    `,
  );

  return result.rows;
}

export async function findActiveApiSourceByStoreId(
  storeId: number,
): Promise<StoreSource | null> {
  const result = await pool.query<StoreSource>(
    `
      SELECT id, store_id, type, url, is_active, source_name,
        last_sync_at::text AS last_sync_at,
        last_sync_status,
        last_imported_count,
        last_updated_count,
        last_failed_count,
        created_at::text AS created_at
      FROM store_sources
      WHERE store_id = $1 AND type = 'api' AND is_active = true
      ORDER BY id ASC
      LIMIT 1
    `,
    [storeId],
  );

  return result.rows[0] ?? null;
}

export async function findApiSourceByStoreId(
  storeId: number,
): Promise<StoreSource | null> {
  const result = await pool.query<StoreSource>(
    `
      SELECT id, store_id, type, url, is_active, source_name,
        last_sync_at::text AS last_sync_at,
        last_sync_status,
        last_imported_count,
        last_updated_count,
        last_failed_count,
        created_at::text AS created_at
      FROM store_sources
      WHERE store_id = $1 AND type = 'api'
      ORDER BY id ASC
      LIMIT 1
    `,
    [storeId],
  );

  return result.rows[0] ?? null;
}

export async function updateStoreSource(
  id: number,
  payload: { url?: string; is_active?: boolean; source_name?: string | null },
): Promise<StoreSource | null> {
  const fields: string[] = [];
  const values: Array<string | boolean | number | null> = [];

  if (typeof payload.url !== "undefined") {
    fields.push(`url = $${fields.length + 1}`);
    values.push(payload.url);
  }

  if (typeof payload.is_active !== "undefined") {
    fields.push(`is_active = $${fields.length + 1}`);
    values.push(payload.is_active);
  }

  if (typeof payload.source_name !== "undefined") {
    fields.push(`source_name = $${fields.length + 1}`);
    values.push(payload.source_name);
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(id);

  const result = await pool.query<StoreSource>(
    `
      UPDATE store_sources
      SET ${fields.join(", ")}
      WHERE id = $${values.length}
      RETURNING id, store_id, type, url, is_active, source_name,
        last_sync_at::text AS last_sync_at,
        last_sync_status,
        last_imported_count,
        last_updated_count,
        last_failed_count,
        created_at::text AS created_at
    `,
    values,
  );

  return result.rows[0] ?? null;
}

export async function findStoreSourceById(
  id: number,
): Promise<StoreSource | null> {
  const result = await pool.query<StoreSource>(
    `
      SELECT id, store_id, type, url, is_active, source_name,
        last_sync_at::text AS last_sync_at,
        last_sync_status,
        last_imported_count,
        last_updated_count,
        last_failed_count,
        created_at::text AS created_at
      FROM store_sources
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function findStoreSourceByStoreAndType(
  storeId: number,
  type: StoreSourceType,
): Promise<StoreSource | null> {
  const result = await pool.query<StoreSource>(
    `
      SELECT id, store_id, type, url, is_active, source_name,
        last_sync_at::text AS last_sync_at,
        last_sync_status,
        last_imported_count,
        last_updated_count,
        last_failed_count,
        created_at::text AS created_at
      FROM store_sources
      WHERE store_id = $1 AND type = $2
      ORDER BY id ASC
      LIMIT 1
    `,
    [storeId, type],
  );

  return result.rows[0] ?? null;
}

export async function updateStoreSourceSyncStatus(
  id: number,
  payload: {
    last_sync_status: StoreSourceSyncStatus;
    last_imported_count: number;
    last_updated_count: number;
    last_failed_count: number;
  },
): Promise<StoreSource | null> {
  const result = await pool.query<StoreSource>(
    `
      UPDATE store_sources
      SET
        last_sync_at = NOW(),
        last_sync_status = $1,
        last_imported_count = $2,
        last_updated_count = $3,
        last_failed_count = $4
      WHERE id = $5
      RETURNING id, store_id, type, url, is_active, source_name,
        last_sync_at::text AS last_sync_at,
        last_sync_status,
        last_imported_count,
        last_updated_count,
        last_failed_count,
        created_at::text AS created_at
    `,
    [
      payload.last_sync_status,
      payload.last_imported_count,
      payload.last_updated_count,
      payload.last_failed_count,
      id,
    ],
  );

  return result.rows[0] ?? null;
}
