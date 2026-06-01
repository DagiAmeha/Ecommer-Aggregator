import { NextFunction, Request, Response } from "express";
import {
  compareProductsSchema,
  createProductSchema,
  productSearchQuerySchema,
  productSuggestionQuerySchema,
} from "./product.validator";
import {
  createProductRecord,
  getAllProducts,
  getProductDetails,
  getProductsByIds,
  getRelatedOffers,
  getSearchSuggestions,
  searchProducts,
} from "./product.service";
import { recordProductEvent } from "../analytics/analytics.model";
import { sendError, sendSuccess } from "../../utils/api-response";

export async function getProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = productSearchQuerySchema.parse(req.query);

    const userId = req.user?.id;

    if (query.ids) {
      const ids = query.ids
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((value) => Number.isFinite(value) && value > 0);

      const uniqueIds = Array.from(new Set(ids));
      const products = await getProductsByIds(uniqueIds, userId);

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
      store_id: query.store_id,
      min_price: query.min_price,
      max_price: query.max_price,
      sort: query.sort,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    } as any;

    const result = await searchProducts(filters as any, userId);

    if (query.search?.trim()) {
      await recordProductEvent({
        event_type: "search",
        user_id: userId,
        search_query: query.search.trim(),
      });
    }

    sendSuccess(res, {
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductSearchSuggestionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = productSuggestionQuerySchema.parse(req.query);
    const result = await getSearchSuggestions(query.q, query.limit ?? 6);
    sendSuccess(res, result);
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

    const product = await getProductDetails(id, req.user?.id);

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

export async function compareProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = compareProductsSchema.parse(req.body);
    const uniqueIds = Array.from(new Set(payload.product_ids));

    if (uniqueIds.length < 2) {
      sendError(res, "Select at least 2 products to compare.", 400);
      return;
    }

    const products = await getProductsByIds(uniqueIds, req.user?.id);

    if (products.length !== uniqueIds.length) {
      sendError(res, "Some products could not be found.", 400);
      return;
    }

    const groupId = products[0]?.product_group_id || products[0]?.group_id;
    if (!groupId) {
      sendError(
        res,
        "You can only compare the same product from different stores",
        400,
      );
      return;
    }

    if (products.some((product) => product.product_group_id !== groupId)) {
      sendError(
        res,
        "You can only compare the same product from different stores",
        400,
      );
      return;
    }

    const storeIds = new Set<number>();
    for (const product of products) {
      if (storeIds.has(product.store?.id)) {
        sendError(res, "You cannot compare products from the same store", 400);
        return;
      }

      storeIds.add(product.store?.id);
    }

    sendSuccess(res, products);
  } catch (error) {
    next(error);
  }
}

export async function getRelatedOffersHandler(
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

    const related = await getRelatedOffers(id, req.user?.id);

    if (!related) {
      sendError(res, "Product not found", 404);
      return;
    }

    sendSuccess(res, related);
  } catch (error) {
    next(error);
  }
}
