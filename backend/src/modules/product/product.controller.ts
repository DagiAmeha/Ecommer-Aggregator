import { NextFunction, Request, Response } from "express";
import {
  createProductSchema,
  productSearchQuerySchema,
} from "./product.validator";
import {
  createProductRecord,
  getAllProducts,
  getProductDetails,
  getProductsByIds,
  searchProducts,
} from "./product.service";
import { sendError, sendSuccess } from "../../utils/api-response";

export async function getProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = productSearchQuerySchema.parse(req.query);

    if (query.ids) {
      const ids = query.ids
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((value) => Number.isFinite(value) && value > 0);

      const uniqueIds = Array.from(new Set(ids));
      const products = await getProductsByIds(uniqueIds);

      sendSuccess(res, {
        data: products,
        pagination: {
          page: 1,
          limit: products.length,
          total: products.length,
        },
      });

      return;
    }

    const keywords = query.keywords
      ? query.keywords
          .split(",")
          .map((keyword) => keyword.trim())
          .filter((keyword) => keyword.length > 0)
      : [];

    const filters = {
      search: query.search,
      category: query.category,
      keywords,
      min_price: query.min_price,
      max_price: query.max_price,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    } as any;

    const result = await searchProducts(filters as any);

    sendSuccess(res, {
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function createProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = createProductSchema.parse(req.body);
    const product = await createProductRecord(payload);
    sendSuccess(res, { product }, 201);
  } catch (error) {
    next(error);
  }
}

export async function getProductByIdHandler(
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

    const product = await getProductDetails(id);

    if (!product) {
      sendError(res, "Product not found", 404);
      return;
    }

    console.log("getProductByIdHandler product:", product);
    sendSuccess(res, { product });
  } catch (error) {
    next(error);
  }
}
