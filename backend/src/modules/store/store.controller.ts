import { NextFunction, Request, Response } from "express";
import {
  createStore,
  deleteStore,
  getStore,
  listStores,
  updateStore,
} from "./store.service";
import { sendError, sendSuccess } from "../../utils/api-response";
import {
  createStoreSchema,
  storeIdParamSchema,
  updateStoreSchema,
} from "./store.validator";

export async function listStoresHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stores = await listStores();
    sendSuccess(res, stores);
  } catch (error) {
    next(error);
  }
}

export async function createStoreHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = createStoreSchema.parse(req.body);

    const store = await createStore({
      owner_id: payload.owner_id,
      store_name: payload.store_name,
      description: payload.description,
      is_active: payload.is_active,
      source_type: payload.source_type,
      url: payload.url,
    });

    sendSuccess(res, store, 201);
  } catch (error) {
    next(error);
  }
}

export async function getStoreByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = storeIdParamSchema.parse(req.params);
    const store = await getStore(params.id);

    if (!store) {
      sendError(res, "Store not found", 404);
      return;
    }

    sendSuccess(res, store);
  } catch (error) {
    next(error);
  }
}

export async function updateStoreHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = storeIdParamSchema.parse(req.params);
    const payload = updateStoreSchema.parse(req.body);

    const existing = await getStore(params.id);
    if (!existing) {
      sendError(res, "Store not found", 404);
      return;
    }

    // Only owner or admin can update
    const requesterId = req.user?.id;
    const role = (req.user as any)?.role?.value;
    if (requesterId !== existing.owner_id && role !== "admin") {
      sendError(res, "Forbidden: insufficient permissions", 403);
      return;
    }

    const updated = await updateStore(params.id, payload);
    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteStoreHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = storeIdParamSchema.parse(req.params);
    const existing = await getStore(params.id);
    if (!existing) {
      sendError(res, "Store not found", 404);
      return;
    }

    // Only admin or owner can delete
    const requesterId = req.user?.id;
    const role = (req.user as any)?.role?.value;
    if (requesterId !== existing.owner_id && role !== "admin") {
      sendError(res, "Forbidden: insufficient permissions", 403);
      return;
    }

    const deleted = await deleteStore(params.id);
    if (!deleted) {
      sendError(res, "Failed to delete store", 500);
      return;
    }

    sendSuccess(res, true);
  } catch (error) {
    next(error);
  }
}
