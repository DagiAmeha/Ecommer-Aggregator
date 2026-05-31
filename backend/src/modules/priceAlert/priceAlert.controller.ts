import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  findPriceAlertForProduct,
  findPriceAlertsByUser,
  upsertPriceAlert,
} from "./priceAlert.model";
import { sendError, sendSuccess } from "../../utils/api-response";

const priceAlertBodySchema = z.object({
  product_id: z.number().int().positive(),
  is_active: z.boolean(),
});

const productIdParamSchema = z.object({
  productId: z.coerce.number().int().positive(),
});

export async function setPriceAlertHandler(
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

    const payload = priceAlertBodySchema.parse(req.body);
    const alert = await upsertPriceAlert(
      userId,
      payload.product_id,
      payload.is_active,
    );
    sendSuccess(res, { alert }, payload.is_active ? 201 : 200);
  } catch (error) {
    next(error);
  }
}

export async function listPriceAlertsHandler(
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

    const items = await findPriceAlertsByUser(userId);
    sendSuccess(res, { items });
  } catch (error) {
    next(error);
  }
}

export async function getPriceAlertForProductHandler(
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
    const alert = await findPriceAlertForProduct(userId, params.productId);
    sendSuccess(res, { alert });
  } catch (error) {
    next(error);
  }
}
