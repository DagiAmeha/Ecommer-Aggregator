import { pool } from "../../config/db";

export interface PriceAlert {
  id: number;
  user_id: number;
  product_id: number;
  is_active: boolean;
  last_notified_price: number | null;
  created_at: string;
  updated_at: string;
}

export async function upsertPriceAlert(
  userId: number,
  productId: number,
  isActive: boolean,
): Promise<PriceAlert> {
  const result = await pool.query<PriceAlert>(
    `
      INSERT INTO price_alerts (user_id, product_id, is_active)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id) DO UPDATE
        SET is_active = EXCLUDED.is_active,
            updated_at = NOW()
      RETURNING
        id, user_id, product_id, is_active,
        last_notified_price::float8 AS last_notified_price,
        created_at::text AS created_at,
        updated_at::text AS updated_at
    `,
    [userId, productId, isActive],
  );

  return result.rows[0];
}

export async function findPriceAlertsByUser(
  userId: number,
): Promise<Array<PriceAlert & { product_name: string; current_price: number }>> {
  const result = await pool.query<
    PriceAlert & { product_name: string; current_price: number }
  >(
    `
      SELECT
        pa.id, pa.user_id, pa.product_id, pa.is_active,
        pa.last_notified_price::float8 AS last_notified_price,
        pa.created_at::text AS created_at,
        pa.updated_at::text AS updated_at,
        p.name AS product_name,
        p.price::float8 AS current_price
      FROM price_alerts pa
      JOIN products p ON p.id = pa.product_id
      WHERE pa.user_id = $1
      ORDER BY pa.updated_at DESC
    `,
    [userId],
  );

  return result.rows;
}

export async function findPriceAlertForProduct(
  userId: number,
  productId: number,
): Promise<PriceAlert | null> {
  const result = await pool.query<PriceAlert>(
    `
      SELECT
        id, user_id, product_id, is_active,
        last_notified_price::float8 AS last_notified_price,
        created_at::text AS created_at,
        updated_at::text AS updated_at
      FROM price_alerts
      WHERE user_id = $1 AND product_id = $2
      LIMIT 1
    `,
    [userId, productId],
  );

  return result.rows[0] ?? null;
}
