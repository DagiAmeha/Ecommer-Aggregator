import { Router } from "express";
import {
  compareProductsHandler,
  createProductHandler,
  getRelatedOffersHandler,
  getProductSearchSuggestionsHandler,
  getProductByIdHandler,
  getProductsHandler,
} from "./product.controller";
import {
  authMiddleware,
  optionalAuthMiddleware,
  requireRoles,
} from "../../middleware/auth.middleware";
import {
  createCategoryHandler,
  deleteCategoryHandler,
  listCategoryHandler,
} from "./category.controller";

const productRouter = Router();

productRouter.get("/", optionalAuthMiddleware, getProductsHandler);
productRouter.get("/search-suggestions", getProductSearchSuggestionsHandler);
productRouter.post("/compare", optionalAuthMiddleware, compareProductsHandler);
productRouter.post(
  "/",
  authMiddleware,
  requireRoles(["vendor", "admin"]),
  createProductHandler,
);
productRouter.get("/categories", listCategoryHandler);
productRouter.post(
  "/categories",
  authMiddleware,
  requireRoles(["admin"]),
  createCategoryHandler,
);
productRouter.delete(
  "/categories/:id",
  authMiddleware,
  requireRoles(["admin"]),
  deleteCategoryHandler,
);
productRouter.get(
  "/:id/related-offers",
  optionalAuthMiddleware,
  getRelatedOffersHandler,
);
productRouter.get("/:id", optionalAuthMiddleware, getProductByIdHandler);

export { productRouter };
