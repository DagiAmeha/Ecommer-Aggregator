import type { Product } from "./catalog";

export interface VendorProductInput {
  name: string;
  description?: string;
  price: number;
  category_id: number;
  image_url?: string;
  product_url?: string;
}

export interface VendorStats {
  total_products: number;
  total_categories: number;
  latest_products: Product[];
}

export interface VendorStoreSource {
  store_id: number;
  source_type: "manual" | "api";
  url?: string | null;
  is_active?: boolean;
  created_at?: string | null;
}

export interface VendorSyncResult {
  message: string;
  imported_products: number;
  updated_products: number;
  failed_products: number;
  sources_processed: number;
  sources_failed: number;
  source_errors: Array<{
    source_id: number;
    store_id: number;
    url: string;
    error: string;
  }>;
}
