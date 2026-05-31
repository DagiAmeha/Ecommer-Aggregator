import { NextFunction, Request, Response } from "express";
import {
  createSavedSearchSchema,
  savedSearchIdParamSchema,
} from "./savedSearch.validator";
import {
  createSavedSearch,
  listSavedSearches,
  removeSavedSearch,
} from "./savedSearch.service";
import { sendError, sendSuccess } from "../../utils/api-response";

export async function createSavedSearchHandler(
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

    const payload = createSavedSearchSchema.parse(req.body);
    const savedSearch = await createSavedSearch(userId, payload);

    sendSuccess(res, { savedSearch }, 201);
  } catch (error) {
    next(error);
  }
}

export async function listSavedSearchesHandler(
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

    const items = await listSavedSearches(userId);
    sendSuccess(res, { items });
  } catch (error) {
    next(error);
  }
}

export async function deleteSavedSearchHandler(
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

    const params = savedSearchIdParamSchema.parse(req.params);
    const deleted = await removeSavedSearch(userId, params.id);

    if (!deleted) {
      sendError(res, "Saved search not found", 404);
      return;
    }

    sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
}
