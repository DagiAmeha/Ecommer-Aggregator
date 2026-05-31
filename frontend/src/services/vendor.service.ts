import { apiRequest } from "./api";
import type { ProductListPayload, Product } from "@/types/catalog";
import type {
  VendorProductInput,
  VendorStats,
  VendorStoreSource,
  VendorSyncResult,
} from "@/types/vendor";

export async function fetchVendorProducts(
  page = 1,
  limit = 10,
): Promise<ProductListPayload> {
  return apiRequest<ProductListPayload>(
    `/vendor/products?page=${page}&limit=${limit}`,
  );
}

export async function fetchVendorProduct(id: number): Promise<Product> {
  const response = await apiRequest<{ product: Product }>(
    `/vendor/products/${id}`,
  );

  return response.product;
}

export async function createVendorProduct(
  payload: VendorProductInput,
): Promise<Product> {
  const response = await apiRequest<{ product: Product }>("/vendor/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.product;
}

export async function updateVendorProduct(
  id: number,
  payload: Partial<VendorProductInput>,
): Promise<Product> {
  const response = await apiRequest<{ product: Product }>(
    `/vendor/products/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );

  return response.product;
}

export async function deleteVendorProduct(id: number): Promise<void> {
  await apiRequest<{ deleted: boolean }>(`/vendor/products/${id}`, {
    method: "DELETE",
  });
}

export async function fetchVendorStats(): Promise<VendorStats> {
  return apiRequest<VendorStats>("/vendor/dashboard/stats");
}

export async function fetchVendorStoreSource(): Promise<VendorStoreSource> {
  return apiRequest<VendorStoreSource>("/vendor/store/source");
}

export async function updateVendorStoreSource(
  payload: Pick<VendorStoreSource, "url" | "is_active">,
): Promise<VendorStoreSource> {
  return apiRequest<VendorStoreSource>("/vendor/store/source", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function syncVendorProducts(): Promise<VendorSyncResult> {
  return apiRequest<VendorSyncResult>("/aggregation/import", {
    method: "POST",
  });
}
