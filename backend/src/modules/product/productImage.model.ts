import { pool } from "../../config/db";

export interface StoredProductImage {
  data: Buffer;
  content_type: string;
}

export async function insertProductImage(
  id: string,
  data: Buffer,
  contentType: string,
): Promise<void> {
  await pool.query(
    `
      INSERT INTO product_images (id, data, content_type, byte_size)
      VALUES ($1, $2, $3, $4)
    `,
    [id, data, contentType, data.byteLength],
  );
}

export async function getProductImageById(
  id: string,
): Promise<StoredProductImage | null> {
  const result = await pool.query<{ data: Buffer; content_type: string }>(
    `
      SELECT data, content_type
      FROM product_images
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}
