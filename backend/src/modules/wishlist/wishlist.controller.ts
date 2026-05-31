import { NextFunction, Request, Response } from "express";
import { addWishlistSchema, productIdParamSchema } from "./wishlist.validator";
import {
  addToWishlist,
  getWishlistCount,
  listWishlist,
  removeFromWishlist,
} from "./wishlist.service";
import { sendError, sendSuccess } from "../../utils/api-response";

export async function addWishlistHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const payload = addWishlistSchema.parse(req.body);
    const product = await addToWishlist(userId, payload.product_id);

    sendSuccess(res, { product }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "Product not found") {
      sendError(res, error.message, 404);
      return;
    }

    next(error);
  }
}

export async function removeWishlistHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const params = productIdParamSchema.parse(req.params);
    const deleted = await removeFromWishlist(userId, params.productId);

    if (!deleted) {
      sendError(res, "Wishlist item not found", 404);
      return;
    }

    sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
}

export async function listWishlistHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const items = await listWishlist(userId);
    sendSuccess(res, { items });
  } catch (error) {
    next(error);
  }
}

export async function wishlistCountHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const count = await getWishlistCount(userId);
    sendSuccess(res, { count });
  } catch (error) {
    next(error);
  }
}
