import { getStoreByOwnerId } from "../store/store.service";
import {
  createStoreSource,
  findStoreSourceByStoreAndType,
  updateStoreSource,
} from "../store/store_source.model";
import { updateStore } from "../store/store.service";
import { listImportJobsByStore } from "../importJob/importJob.model";
import {
  createVendorProduct,
  deleteVendorProduct,
  findVendorProductById,
  findVendorProducts,
  getVendorDashboardStats,
  updateVendorProduct,
  VendorProductInput,
} from "./vendor.model";

async function getVendorStoreId(userId: number): Promise<number> {
  const store = await getStoreByOwnerId(userId);

  if (!store) {
    throw new Error("Vendor store not found");
  }

  return store.id;
}

export async function listVendorProducts(
  userId: number,
  page: number,
  limit: number,
) {
  const storeId = await getVendorStoreId(userId);
  return findVendorProducts(storeId, page, limit);
}

export async function getVendorProduct(userId: number, productId: number) {
  const storeId = await getVendorStoreId(userId);
  return findVendorProductById(storeId, productId);
}

export async function createVendorProductForUser(
  userId: number,
  payload: VendorProductInput,
) {
  const storeId = await getVendorStoreId(userId);
  return createVendorProduct(storeId, payload);
}

export async function updateVendorProductForUser(
  userId: number,
  productId: number,
  payload: Partial<VendorProductInput>,
) {
  const storeId = await getVendorStoreId(userId);
  return updateVendorProduct(storeId, productId, payload);
}

export async function deleteVendorProductForUser(
  userId: number,
  productId: number,
): Promise<boolean> {
  const storeId = await getVendorStoreId(userId);
  return deleteVendorProduct(storeId, productId);
}

export async function getVendorStats(userId: number) {
  const storeId = await getVendorStoreId(userId);
  return getVendorDashboardStats(storeId, 5);
}

export async function getVendorStoreSourceType(userId: number) {
  const storeId = await getVendorStoreId(userId);
  const scrapingSource = await findStoreSourceByStoreAndType(
    storeId,
    "scraping",
  );
  const apiSource = await findStoreSourceByStoreAndType(storeId, "api");
  const source = scrapingSource ?? apiSource;

  return {
    store_id: storeId,
    source_type: source ? source.type : "manual",
    source_id: source?.id ?? null,
    source_name: source?.source_name ?? null,
    url: source?.url ?? null,
    is_active: source?.is_active ?? false,
    created_at: source?.created_at ?? null,
    last_sync_at: source?.last_sync_at ?? null,
    last_sync_status: source?.last_sync_status ?? null,
    last_imported_count: source?.last_imported_count ?? null,
    last_updated_count: source?.last_updated_count ?? null,
    last_failed_count: source?.last_failed_count ?? null,
  };
}

export async function updateVendorStoreSource(
  userId: number,
  payload: {
    source_type: "manual" | "api" | "scraping";
    url?: string;
    is_active?: boolean;
    source_name?: string;
  },
) {
  const storeId = await getVendorStoreId(userId);
  const requestedType = payload.source_type;
  const existing = await findStoreSourceByStoreAndType(storeId, requestedType);

  if (requestedType === "manual") {
    if (existing) {
      await updateStoreSource(existing.id, { is_active: false });
    }

    return getVendorStoreSourceType(userId);
  }

  const baseUrl = payload.url?.trim();
  if (!baseUrl) {
    throw new Error("URL is required for API or scraping sources");
  }

  if (requestedType === "scraping") {
    const hostname = new URL(baseUrl).hostname;
    if (hostname !== "books.toscrape.com") {
      throw new Error("Scraping is restricted to books.toscrape.com");
    }
  }

  if (!existing) {
    await createStoreSource({
      store_id: storeId,
      type: requestedType,
      url: baseUrl,
      is_active: payload.is_active ?? true,
      source_name: payload.source_name ?? null,
    });
  } else {
    await updateStoreSource(existing.id, {
      url: baseUrl,
      is_active: payload.is_active ?? existing.is_active,
      source_name: payload.source_name ?? existing.source_name,
    });
  }

  return getVendorStoreSourceType(userId);
}

export async function getVendorStoreProfile(userId: number) {
  const store = await getStoreByOwnerId(userId);
  if (!store) {
    throw new Error("Vendor store not found");
  }

  const importJobs = await listImportJobsByStore(store.id, 5);

  return {
    id: store.id,
    store_name: store.store_name,
    description: store.description,
    is_active: store.is_active,
    recent_import_jobs: importJobs,
  };
}

export async function updateVendorStoreProfile(
  userId: number,
  payload: {
    store_name?: string;
    description?: string;
    is_active?: boolean;
  },
) {
  const store = await getStoreByOwnerId(userId);
  if (!store) {
    throw new Error("Vendor store not found");
  }

  const updated = await updateStore(store.id, payload);
  if (!updated) {
    throw new Error("Failed to update store");
  }

  return {
    id: updated.id,
    store_name: updated.store_name,
    description: updated.description,
    is_active: updated.is_active,
  };
}
