import { apiRequest } from "./api";
import type {
  Category,
  CompareProduct,
  Product,
  ProductDetail,
  ProductFilters,
  ProductListPayload,
} from "@/types/catalog";

function toSearchParams(
  filters: ProductFilters = {},
  extra: Record<string, string | number | undefined> = {},
): string {
  const params = new URLSearchParams();
  const entries = { ...filters, ...extra } as Record<
    string,
    string | number | undefined
  >;

  for (const [key, value] of Object.entries(entries)) {
    if (typeof value === "undefined" || value === "") {
      continue;
    }

    params.set(key, String(value));
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await apiRequest<{ items: Category[] }>(
    "/products/categories",
  );

  return response.items;
}

export async function fetchProducts(
  filters: ProductFilters = {},
): Promise<ProductListPayload> {
  return apiRequest<ProductListPayload>(`/products${toSearchParams(filters)}`);
}

export async function fetchProductById(id: number): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`);
}

export async function fetchProductDetail(id: number): Promise<ProductDetail> {
  return apiRequest<ProductDetail>(`/products/${id}`);
}

export async function fetchComparisonProducts(
  ids: number[],
): Promise<CompareProduct[]> {
  const targetIds = ids.slice(0, 4);

  if (targetIds.length === 0) {
    return [];
  }

  const response = await apiRequest<ProductListPayload>(
    `/products?ids=${targetIds.join(",")}`,
  );

  return response.data as CompareProduct[];
}
