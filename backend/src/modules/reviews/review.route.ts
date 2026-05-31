import { Router } from "express";
import {
  createReviewHandler,
  deleteReviewHandler,
  listProductReviewsHandler,
} from "./review.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const reviewRouter = Router();

reviewRouter.post("/", authMiddleware, createReviewHandler);
reviewRouter.get("/product/:productId", listProductReviewsHandler);
reviewRouter.delete("/:id", authMiddleware, deleteReviewHandler);

export { reviewRouter };
