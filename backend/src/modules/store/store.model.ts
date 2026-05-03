import { pool } from "../../config/db";
import { createStoreSource, StoreSourceType } from "./store_source.model";

export interface Store {
  id: number;
  owner_id: number;
  store_name: string;
  description: string | null;
  is_active: boolean;
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

  if (data.source_type === "api" && data.url) {
    await createStoreSource({
      store_id: result.rows[0].id,
      type: "api",
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
