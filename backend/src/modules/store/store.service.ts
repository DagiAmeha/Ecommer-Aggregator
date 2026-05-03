import {
  CreateStoreInput,
  Store,
  UpdateStoreInput,
  createStoreRecord,
  deleteStoreById,
  findAllStores,
  findStoreById,
  updateStoreById,
} from "./store.model";

export async function createStore(payload: CreateStoreInput): Promise<Store> {
  return createStoreRecord(payload);
}

export async function listStores(): Promise<Store[]> {
  return findAllStores();
}

export async function getStore(id: number): Promise<Store | null> {
  return findStoreById(id);
}

export async function updateStore(
  id: number,
  payload: UpdateStoreInput,
): Promise<Store | null> {
  return updateStoreById(id, payload);
}

export async function deleteStore(id: number): Promise<boolean> {
  return deleteStoreById(id);
}
