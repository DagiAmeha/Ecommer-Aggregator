import { pool } from "../../config/db";
import {
  countWishlistedProducts,
  findProductById,
  findWishlistedProducts,
  Product,
} from "../product/product.model";

export async function addToWishlist(
  userId: number,
  productId: number,
): Promise<Product> {
  const product = await findProductById(productId, userId);

  if (!product) {
    throw new Error("Product not found");
  }

  await pool.query(
    `
      INSERT INTO wishlists (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
    `,
    [userId, productId],
  );

  const updated = await findProductById(productId, userId);
  if (!updated) {
    throw new Error("Product not found");
  }

  return updated;
}

export async function removeFromWishlist(
  userId: number,
  productId: number,
): Promise<boolean> {
  const result = await pool.query(
    `
      DELETE FROM wishlists
      WHERE user_id = $1 AND product_id = $2
    `,
    [userId, productId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function listWishlist(userId: number): Promise<Product[]> {
  return findWishlistedProducts(userId);
}

export async function getWishlistCount(userId: number): Promise<number> {
  return countWishlistedProducts(userId);
}
