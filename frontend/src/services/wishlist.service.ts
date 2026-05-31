import { apiRequest } from "./api";
import type { Product } from "@/types/catalog";

export async function addToWishlist(
  productId: number,
): Promise<{ product: Product }> {
  return apiRequest<{ product: Product }>("/wishlist", {
    method: "POST",
    body: JSON.stringify({ product_id: productId }),
  });
}

export async function removeFromWishlist(productId: number): Promise<void> {
  await apiRequest<{ deleted: boolean }>(`/wishlist/${productId}`, {
    method: "DELETE",
  });
}

export async function fetchWishlist(): Promise<{ items: Product[] }> {
  return apiRequest<{ items: Product[] }>("/wishlist");
}

export async function fetchWishlistCount(): Promise<{ count: number }> {
  return apiRequest<{ count: number }>("/wishlist/count");
}
