import { pool } from "../../config/db";

export interface SavedSearch {
  id: number;
  user_id: number;
  query: string;
  category: string | null;
  min_price: number | null;
  max_price: number | null;
  created_at: string;
}

export interface CreateSavedSearchInput {
  query: string;
  category?: string;
  min_price?: number;
  max_price?: number;
}

export async function insertSavedSearch(
  userId: number,
  input: CreateSavedSearchInput,
): Promise<SavedSearch> {
  const result = await pool.query<SavedSearch>(
    `
      INSERT INTO saved_searches (user_id, query, category, min_price, max_price)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, query, category) DO UPDATE
        SET min_price = EXCLUDED.min_price,
            max_price = EXCLUDED.max_price,
            created_at = NOW()
      RETURNING id, user_id, query, category, min_price, max_price, created_at
    `,
    [
      userId,
      input.query,
      input.category ?? null,
      input.min_price ?? null,
      input.max_price ?? null,
    ],
  );

  return result.rows[0];
}

export async function findSavedSearches(
  userId: number,
): Promise<SavedSearch[]> {
  const result = await pool.query<SavedSearch>(
    `
      SELECT id, user_id, query, category, min_price, max_price, created_at
      FROM saved_searches
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId],
  );

  return result.rows;
}

export async function deleteSavedSearch(
  userId: number,
  id: number,
): Promise<boolean> {
  const result = await pool.query(
    `
      DELETE FROM saved_searches
      WHERE user_id = $1 AND id = $2
    `,
    [userId, id],
  );

  return (result.rowCount ?? 0) > 0;
}
