import { pool } from "../../config/db";
import { createNotification } from "../notification/notification.model";

export async function recordPriceHistory(
  productId: number,
  price: number,
): Promise<void> {
  await pool.query(
    `
      INSERT INTO product_price_history (product_id, price)
      VALUES ($1, $2)
    `,
    [productId, price],
  );
}

export async function handleProductPriceChange(
  productId: number,
  productName: string,
  oldPrice: number,
  newPrice: number,
): Promise<void> {
  if (oldPrice === newPrice) {
    return;
  }

  await recordPriceHistory(productId, newPrice);

  const alerts = await pool.query<{
    id: number;
    user_id: number;
    last_notified_price: number | null;
  }>(
    `
      SELECT id, user_id, last_notified_price::float8 AS last_notified_price
      FROM price_alerts
      WHERE product_id = $1 AND is_active = true
    `,
    [productId],
  );

  for (const alert of alerts.rows) {
    const baseline = alert.last_notified_price ?? oldPrice;
    if (baseline === newPrice) {
      continue;
    }

    const direction = newPrice < baseline ? "dropped" : "increased";
    await createNotification({
      user_id: alert.user_id,
      type: "price_alert",
      title: "Price change alert",
      message: `"${productName}" has ${direction} from $${baseline.toFixed(2)} to $${newPrice.toFixed(2)}.`,
      related_product_id: productId,
    });

    await pool.query(
      `
        UPDATE price_alerts
        SET last_notified_price = $1, updated_at = NOW()
        WHERE id = $2
      `,
      [newPrice, alert.id],
    );
  }
}
