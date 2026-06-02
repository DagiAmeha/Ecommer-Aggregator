import axios from "axios";
import {
  createImportJob,
  completeImportJob,
} from "../importJob/importJob.model";
import {
  normalizeProductTitle,
  upsertApiProduct,
} from "../product/product.model";
import { getStoreByOwnerId } from "../store/store.service";
import {
  findStoreSourceById,
  StoreSource,
  updateStoreSourceSyncStatus,
} from "../store/store_source.model";

export interface NormalizedImportProduct {
  external_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  product_url: string | null;
  external_rating_rate: number | null;
  external_rating_count: number | null;
  stock_quantity: number;
}

export interface ApiSourceSyncResult {
  imported_products: number;
  updated_products: number;
  failed_products: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

/**
 * Normalize common JSON product feed shapes (FakeStore, generic catalogs).
 */
export function normalizeApiProductRecord(
  raw: unknown,
  fallbackCategory = "General",
): NormalizedImportProduct | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const externalId = readString(
    record.id ?? record._id ?? record.sku ?? record.product_id,
  );
  const title = readString(record.name ?? record.title);
  const price = readNumber(record.price ?? record.unit_price);

  if (!externalId || !title || price === null) {
    return null;
  }

  let category = fallbackCategory;
  if (typeof record.category === "string") {
    category = record.category;
  } else {
    const categoryRecord = asRecord(record.category);
    const categoryName = categoryRecord
      ? readString(categoryRecord.name)
      : null;
    if (categoryName) {
      category = categoryName;
    }
  }

  const ratingRecord = asRecord(record.rating);
  const externalRatingRate =
    readNumber(record.rating_rate) ??
    (ratingRecord ? readNumber(ratingRecord.rate) : null);
  const externalRatingCount =
    readNumber(record.rating_count) ??
    (ratingRecord ? readNumber(ratingRecord.count) : null);

  const stockRaw =
    record.stock_quantity ??
    record.stock ??
    record.inventory ??
    record.in_stock;
  let stockQuantity = 1;
  if (typeof stockRaw === "boolean") {
    stockQuantity = stockRaw ? 1 : 0;
  } else {
    const parsedStock = readNumber(stockRaw);
    if (parsedStock !== null) {
      stockQuantity = Math.max(0, Math.floor(parsedStock));
    }
  }

  return {
    external_id: externalId,
    name: normalizeProductTitle(title),
    description: readString(record.description),
    price,
    category,
    image_url:
      readString(record.image_url ?? record.image ?? record.thumbnail) ?? null,
    product_url: readString(record.product_url ?? record.url ?? record.link),
    external_rating_rate: externalRatingRate,
    external_rating_count: externalRatingCount,
    stock_quantity: stockQuantity,
  };
}

export async function fetchProductsFromApiSource(
  source: StoreSource,
): Promise<unknown[]> {
  const response = await axios.get<unknown>(source.url, {
    timeout: 15000,
    headers: { Accept: "application/json" },
  });

  const payload = response.data;
  if (Array.isArray(payload)) {
    return payload;
  }

  const envelope = asRecord(payload);
  if (!envelope) {
    throw new Error("Source returned an invalid payload: expected a JSON array.");
  }

  const list =
    envelope.data ??
    envelope.products ??
    envelope.items ??
    envelope.results;

  if (!Array.isArray(list)) {
    throw new Error(
      "Source returned an invalid payload: expected an array of products.",
    );
  }

  return list;
}

export async function syncApiSourceById(
  source: StoreSource,
): Promise<ApiSourceSyncResult> {
  if (source.type !== "api") {
    throw new Error("Source is not an API feed");
  }

  if (!source.is_active) {
    throw new Error("API source is disabled");
  }

  const job = await createImportJob({
    store_id: source.store_id,
    source_id: source.id,
    job_type: "api",
  });

  let importedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;

  try {
    const rawProducts = await fetchProductsFromApiSource(source);

    for (const raw of rawProducts) {
      const normalized = normalizeApiProductRecord(raw);
      if (!normalized) {
        failedCount += 1;
        continue;
      }

      try {
        const action = await upsertApiProduct({
          name: normalized.name,
          description: normalized.description ?? undefined,
          price: normalized.price,
          category: normalized.category,
          store_id: source.store_id,
          image_url: normalized.image_url ?? undefined,
          product_url: normalized.product_url ?? source.url,
          external_id: normalized.external_id,
          external_rating_rate: normalized.external_rating_rate,
          external_rating_count: normalized.external_rating_count,
          stock_quantity: normalized.stock_quantity,
          source: "api",
        });

        if (action.action === "imported") {
          importedCount += 1;
        } else {
          updatedCount += 1;
        }
      } catch (error) {
        failedCount += 1;
        console.error(
          `[api-import] product upsert failed for source ${source.id} (${source.url}):`,
          error,
        );
      }
    }

    const status =
      failedCount > 0 && importedCount + updatedCount > 0
        ? "partial"
        : failedCount > 0 && importedCount + updatedCount === 0
          ? "failed"
          : "success";

    await updateStoreSourceSyncStatus(source.id, {
      last_sync_status: status,
      last_imported_count: importedCount,
      last_updated_count: updatedCount,
      last_failed_count: failedCount,
    });

    await completeImportJob(job.id, {
      status,
      imported_count: importedCount,
      updated_count: updatedCount,
      failed_count: failedCount,
    });

    return {
      imported_products: importedCount,
      updated_products: updatedCount,
      failed_products: failedCount,
    };
  } catch (error) {
    await updateStoreSourceSyncStatus(source.id, {
      last_sync_status: "failed",
      last_imported_count: 0,
      last_updated_count: 0,
      last_failed_count: 0,
    });

    await completeImportJob(job.id, {
      status: "failed",
      imported_count: 0,
      updated_count: 0,
      failed_count: 0,
      error_message:
        error instanceof Error ? error.message : "Unknown source failure",
    });

    throw error;
  }
}

export async function syncApiSourceForVendor(
  userId: number,
  sourceId: number,
): Promise<ApiSourceSyncResult> {
  const store = await getStoreByOwnerId(userId);
  if (!store) {
    throw new Error("Vendor store not found");
  }

  const source = await findStoreSourceById(sourceId);
  if (!source || source.store_id !== store.id || source.type !== "api") {
    throw new Error("API source not found for this vendor");
  }

  return syncApiSourceById(source);
}
