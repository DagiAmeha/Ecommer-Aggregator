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

export interface StoreStats {
  total_products: number;
  average_rating: number;
  lowest_price: number | null;
  highest_price: number | null;
  categories: Category[];
}

export interface StorePublicProfile {
  store: {
    id: number;
    store_name: string;
    description: string | null;
    is_active: boolean;
  };
  stats: StoreStats;
}

export interface ProductRelation {
  id: number;
  name: string;
}

export type ProductSource = "manual" | "api" | "scraping";
export type RatingSource = "internal" | "external";

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
  normalized_title: string;
  product_group_id: string;
  average_rating: number;
  review_count: number;
  rating_source: RatingSource;
  is_wishlisted: boolean;
  stock_quantity: number;
  price_alert_active?: boolean;
}

export interface ProductListPayload {
  data: Product[];
  pagination: Pagination;
}

export interface SearchSuggestion {
  query: string;
  type: "product" | "category" | "store";
}

export interface SearchSuggestionPayload {
  suggestions: SearchSuggestion[];
  didYouMean: string | null;
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

export type ProductSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "rating"
  | "popularity";

export interface ProductFilters {
  search?: string;
  category?: string;
  store_id?: number;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
  sort?: ProductSort;
}
