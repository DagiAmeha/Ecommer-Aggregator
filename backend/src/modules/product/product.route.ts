import { Router } from "express";
import {
  createProductHandler,
  getProductByIdHandler,
  getProductsHandler,
} from "./product.controller";
import { authMiddleware, requireRoles } from "../../middleware/auth.middleware";
import {
  createCategoryHandler,
  deleteCategoryHandler,
  listCategoryHandler,
} from "./category.controller";

const productRouter = Router();

productRouter.get("/", getProductsHandler);
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
productRouter.get("/:id", getProductByIdHandler);

export { productRouter };
