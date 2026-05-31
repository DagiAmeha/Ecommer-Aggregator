import { NextFunction, Request, Response } from "express";
import { sendError, sendSuccess } from "../../utils/api-response";
import {
  scrapingSyncParamsSchema,
  scrapingSyncQuerySchema,
} from "./scraping.validator";
import { syncScrapingSourceForVendor } from "./scraping.service";

export async function syncScrapingSourceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = scrapingSyncParamsSchema.parse(req.params);
    const query = scrapingSyncQuerySchema.parse(req.query);
    const user = req.authUser;

    if (!user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const result = await syncScrapingSourceForVendor(user.id, params.sourceId, {
      pages: query.pages,
      limit: query.limit,
    });

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
