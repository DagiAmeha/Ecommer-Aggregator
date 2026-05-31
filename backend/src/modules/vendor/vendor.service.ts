import { getStoreByOwnerId } from "../store/store.service";
import {
  createStoreSource,
  findActiveApiSourceByStoreId,
  findApiSourceByStoreId,
  updateStoreSource,
} from "../store/store_source.model";
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
  const apiSource = await findApiSourceByStoreId(storeId);

  return {
    store_id: storeId,
    source_type: apiSource ? "api" : "manual",
    url: apiSource?.url ?? null,
    is_active: apiSource?.is_active ?? false,
    created_at: apiSource?.created_at ?? null,
  };
}

export async function updateVendorStoreSource(
  userId: number,
  payload: { url: string; is_active: boolean },
) {
  const storeId = await getVendorStoreId(userId);
  const existing = await findApiSourceByStoreId(storeId);

  if (!existing) {
    await createStoreSource({
      store_id: storeId,
      type: "api",
      url: payload.url,
      is_active: payload.is_active,
    });
  } else {
    await updateStoreSource(existing.id, {
      url: payload.url,
      is_active: payload.is_active,
    });
  }

  return getVendorStoreSourceType(userId);
}
