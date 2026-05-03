import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response";
import { importFromActiveSources } from "./aggregation.service";

export async function importProductsFromSources(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await importFromActiveSources();

    sendSuccess(res, {
      message: "Products imported from active sources",
      ...result,
    });
  } catch (error) {
    next(error);
  }
}
