import type { Product } from "./catalog";

export interface VendorProductInput {
  name: string;
  description?: string;
  price: number;
  stock_quantity?: number;
  category_id: number;
  image_url?: string;
  product_url?: string;
}

export interface VendorStats {
  total_products: number;
  total_categories: number;
  total_views: number;
  total_clicks: number;
  low_stock_products: number;
  latest_products: Product[];
}

export interface VendorStoreProfile {
  id: number;
  store_name: string;
  description: string | null;
  is_active: boolean;
  recent_import_jobs: Array<{
    id: number;
    job_type: string;
    status: string;
    imported_count: number;
    updated_count: number;
    failed_count: number;
    started_at: string;
  }>;
}

export interface VendorStoreSource {
  store_id: number;
  source_type: "manual" | "api" | "scraping";
  source_id?: number | null;
  source_name?: string | null;
  url?: string | null;
  is_active?: boolean;
  created_at?: string | null;
  last_sync_at?: string | null;
  last_sync_status?: "idle" | "success" | "partial" | "failed" | null;
  last_imported_count?: number | null;
  last_updated_count?: number | null;
  last_failed_count?: number | null;
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

export interface VendorScrapingSyncResult {
  imported_products: number;
  updated_products: number;
  failed_products: number;
}
