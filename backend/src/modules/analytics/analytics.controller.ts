import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  getRecommendations,
  getTopSearchQueries,
  getTrendingProducts,
  recordProductEvent,
} from "./analytics.model";
import { sendSuccess } from "../../utils/api-response";

const recordEventSchema = z.object({
  event_type: z.enum(["view", "click", "search"]),
  product_id: z.number().int().positive().optional(),
  search_query: z.string().trim().max(255).optional(),
});

const limitQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(24).optional(),
  product_id: z.coerce.number().int().positive().optional(),
});

export async function recordEventHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = recordEventSchema.parse(req.body);
    await recordProductEvent({
      event_type: payload.event_type,
      product_id: payload.product_id,
      user_id: req.user?.id,
      search_query: payload.search_query,
    });
    sendSuccess(res, { recorded: true }, 201);
  } catch (error) {
    next(error);
  }
}

export async function trendingProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = limitQuerySchema.parse(req.query);
    const items = await getTrendingProducts(query.limit ?? 8);
    sendSuccess(res, { items });
  } catch (error) {
    next(error);
  }
}

export async function recommendationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = limitQuerySchema.parse(req.query);
    const items = await getRecommendations(query.product_id, query.limit ?? 8);
    sendSuccess(res, { items });
  } catch (error) {
    next(error);
  }
}

export async function topSearchesHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const items = await getTopSearchQueries();
    sendSuccess(res, { items });
  } catch (error) {
    next(error);
  }
}
