import { syncApiSourceForVendor } from "../aggregation/apiImport.service";
import { syncScrapingSourceForVendor } from "../scraping/scraping.service";
import { getVendorStoreSourceType } from "./vendor.service";

export type VendorSourceSyncResult = {
  source_type: "api" | "scraping";
  imported_products: number;
  updated_products: number;
  failed_products: number;
};

export async function syncVendorStoreSourceForUser(
  userId: number,
  options: { pages?: number; limit?: number } = {},
): Promise<VendorSourceSyncResult> {
  const source = await getVendorStoreSourceType(userId);

  if (source.source_type === "manual") {
    throw new Error("No active source configured for syncing.");
  }

  if (!source.source_id) {
    throw new Error("Source is not configured. Save your integration settings first.");
  }

  if (!source.is_active) {
    throw new Error("Source is disabled. Enable it before syncing.");
  }

  if (source.source_type === "scraping") {
    const result = await syncScrapingSourceForVendor(
      userId,
      source.source_id,
      options,
    );

    return {
      source_type: "scraping",
      ...result,
    };
  }

  const result = await syncApiSourceForVendor(userId, source.source_id);

  return {
    source_type: "api",
    ...result,
  };
}
