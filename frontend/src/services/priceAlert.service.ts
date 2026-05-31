import { apiRequest } from "./api";

export interface PriceAlert {
  id: number;
  user_id: number;
  product_id: number;
  is_active: boolean;
  last_notified_price: number | null;
  product_name?: string;
  current_price?: number;
}

export async function setPriceAlert(
  productId: number,
  isActive: boolean,
): Promise<{ alert: PriceAlert }> {
  return apiRequest<{ alert: PriceAlert }>("/price-alerts", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, is_active: isActive }),
  });
}

export async function fetchPriceAlerts(): Promise<{ items: PriceAlert[] }> {
  return apiRequest<{ items: PriceAlert[] }>("/price-alerts");
}

export async function fetchPriceAlertForProduct(
  productId: number,
): Promise<{ alert: PriceAlert | null }> {
  return apiRequest<{ alert: PriceAlert | null }>(
    `/price-alerts/product/${productId}`,
  );
}
