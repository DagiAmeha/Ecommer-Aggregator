import { NextFunction, Request, Response } from "express";
import {
  createVendorProductForUser,
  deleteVendorProductForUser,
  getVendorProduct,
  getVendorStoreProfile,
  getVendorStoreSourceType,
  getVendorStats,
  listVendorProducts,
  updateVendorStoreProfile,
  updateVendorStoreSource,
  updateVendorProductForUser,
} from "./vendor.service";
import {
  vendorProductCreateSchema,
  vendorProductQuerySchema,
  vendorProductUpdateSchema,
  vendorStoreSourceSchema,
} from "./vendor.validator";
import { vendorStoreProfileSchema } from "./vendorStore.validator";
import { sendError, sendSuccess } from "../../utils/api-response";

function handleVendorError(
  error: unknown,
  res: Response,
  next: NextFunction,
): void {
  if (error instanceof Error && error.message === "Vendor store not found") {
    sendError(res, "Vendor store not found", 404);
    return;
  }

  next(error);
}

export async function listVendorProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = vendorProductQuerySchema.parse(req.query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const user = req.authUser;

    if (!user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const result = await listVendorProducts(user.id, page, limit);

    sendSuccess(res, {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: result.total,
      },
    });
  } catch (error) {
    handleVendorError(error, res, next);
  }
}

export async function getVendorProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      sendError(res, "Invalid product id", 400);
      return;
    }

    const user = req.authUser;

    if (!user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const product = await getVendorProduct(user.id, id);

    if (!product) {
      sendError(res, "Product not found", 404);
      return;
    }

    sendSuccess(res, { product });
  } catch (error) {
    handleVendorError(error, res, next);
  }
}

export async function createVendorProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = vendorProductCreateSchema.parse(req.body);
    const user = req.authUser;

    if (!user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const product = await createVendorProductForUser(user.id, payload);
    sendSuccess(res, { product }, 201);
  } catch (error) {
    handleVendorError(error, res, next);
  }
}

export async function updateVendorProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      sendError(res, "Invalid product id", 400);
      return;
    }

    const payload = vendorProductUpdateSchema.parse(req.body);
    const user = req.authUser;

    if (!user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const updated = await updateVendorProductForUser(user.id, id, payload);

    if (!updated) {
      sendError(res, "Product not found", 404);
      return;
    }

    sendSuccess(res, { product: updated });
  } catch (error) {
    handleVendorError(error, res, next);
  }
}

export async function deleteVendorProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      sendError(res, "Invalid product id", 400);
      return;
    }

    const user = req.authUser;

    if (!user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const deleted = await deleteVendorProductForUser(user.id, id);

    if (!deleted) {
      sendError(res, "Product not found", 404);
      return;
    }

    sendSuccess(res, { deleted: true });
  } catch (error) {
    handleVendorError(error, res, next);
  }
}

export async function getVendorDashboardStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = req.authUser;

    if (!user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const stats = await getVendorStats(user.id);
    sendSuccess(res, stats);
  } catch (error) {
    handleVendorError(error, res, next);
  }
}

export async function getVendorStoreSourceTypeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = req.authUser;

    if (!user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const source = await getVendorStoreSourceType(user.id);
    sendSuccess(res, source);
  } catch (error) {
    handleVendorError(error, res, next);
  }
}

export async function updateVendorStoreSourceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = req.authUser;

    if (!user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const payload = vendorStoreSourceSchema.parse(req.body);
    const updated = await updateVendorStoreSource(user.id, payload);
    sendSuccess(res, updated);
  } catch (error) {
    handleVendorError(error, res, next);
  }
}

export async function getVendorStoreProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = req.authUser;
    if (!user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const store = await getVendorStoreProfile(user.id);
    sendSuccess(res, store);
  } catch (error) {
    handleVendorError(error, res, next);
  }
}

export async function updateVendorStoreProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = req.authUser;
    if (!user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const payload = vendorStoreProfileSchema.parse(req.body);
    const updated = await updateVendorStoreProfile(user.id, payload);
    sendSuccess(res, updated);
  } catch (error) {
    handleVendorError(error, res, next);
  }
}
