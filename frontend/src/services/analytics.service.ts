import { apiRequest } from "./api";
import type { Product } from "@/types/catalog";

export type ProductSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "rating"
  | "popularity";

export type ProductEventType = "view" | "click" | "search";

export async function recordProductEvent(input: {
  event_type: ProductEventType;
  product_id?: number;
  search_query?: string;
}): Promise<void> {
  await apiRequest("/analytics/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchTrendingProducts(limit = 8): Promise<Product[]> {
  const response = await apiRequest<{ items: Product[] }>(
    `/analytics/trending?limit=${limit}`,
  );
  return response.items;
}

export async function fetchRecommendations(
  productId?: number,
  limit = 8,
): Promise<Product[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (productId) {
    params.set("product_id", String(productId));
  }
  const response = await apiRequest<{ items: Product[] }>(
    `/analytics/recommendations?${params.toString()}`,
  );
  return response.items;
}

export async function fetchTopSearches(): Promise<
  Array<{ query: string; count: number }>
> {
  const response = await apiRequest<{
    items: Array<{ query: string; count: number }>;
  }>("/analytics/top-searches");
  return response.items;
}
