import { NextFunction, Request, Response } from "express";
import {
  categoryIdParamSchema,
  createCategorySchema,
} from "./category.validator";
import {
  createCategoryRecord,
  deleteCategoryRecord,
  getCategoryDetails,
  listCategoryRecords,
} from "./category.service";
import { sendError, sendSuccess } from "../../utils/api-response";

function getPgErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  if (!("code" in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

export async function createCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = createCategorySchema.parse(req.body);
    const category = await createCategoryRecord(payload);

    sendSuccess(res, { category }, 201);
  } catch (error) {
    const code = getPgErrorCode(error);

    if (code === "23505") {
      sendError(res, "Category already exists", 409);
      return;
    }

    next(error);
  }
}

export async function listCategoryHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categories = await listCategoryRecords();

    sendSuccess(res, {
      items: categories,
      meta: { count: categories.length },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = categoryIdParamSchema.parse(req.params);
    const category = await getCategoryDetails(params.id);

    if (!category) {
      sendError(res, "Category not found", 404);
      return;
    }

    const deleted = await deleteCategoryRecord(params.id);

    if (!deleted) {
      sendError(res, "Category not found", 404);
      return;
    }

    sendSuccess(res, { deleted: true });
  } catch (error) {
    const code = getPgErrorCode(error);

    if (code === "23503") {
      sendError(
        res,
        "Category cannot be deleted because it is used by products",
        409,
      );
      return;
    }

    next(error);
  }
}
