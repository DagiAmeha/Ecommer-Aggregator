import { NextFunction, Request, Response } from "express";
import {
  createReviewSchema,
  productIdParamSchema,
  reviewIdParamSchema,
} from "./review.validator";
import {
  deleteReviewById,
  ensureManualProduct,
  listReviewsForProduct,
  upsertReview,
} from "./review.service";
import { sendError, sendSuccess } from "../../utils/api-response";

export async function createReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = createReviewSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    try {
      await ensureManualProduct(payload.product_id);
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message;

        if (message === "Product not found") {
          sendError(res, message, 404);
          return;
        }

        if (message === "Reviews are disabled for API-imported products.") {
          sendError(res, message, 403);
          return;
        }
      }

      throw error;
    }

    const review = await upsertReview(userId, payload);
    sendSuccess(res, { review }, 201);
  } catch (error) {
    next(error);
  }
}

export async function listProductReviewsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = productIdParamSchema.parse(req.params);
    const result = await listReviewsForProduct(params.productId);

    if (!result) {
      sendError(res, "Product not found", 404);
      return;
    }

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function deleteReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = reviewIdParamSchema.parse(req.params);
    const userId = req.user?.id;

    if (!userId) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const deleted = await deleteReviewById(params.id, userId);

    if (!deleted) {
      sendError(res, "Review not found", 404);
      return;
    }

    sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
}
