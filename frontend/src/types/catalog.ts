export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface Store {
  id: number;
  name: string;
}

export interface ProductRelation {
  id: number;
  name: string;
}

export type ProductSource = "manual" | "api";

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  product_url: string | null;
  created_at: string;
  updated_at: string;
  source: ProductSource;
  external_id: string | null;
  category: ProductRelation;
  store: ProductRelation;
  group_id: string;
}

export interface ProductListPayload {
  data: Product[];
  pagination: Pagination;
}

export type CompareProduct = Product;

export type ProductDetail = {
  product: Product;
};

export interface Offer {
  id: string;
  storeId: number;
  storeName: string;
  price: number;
  url?: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}
