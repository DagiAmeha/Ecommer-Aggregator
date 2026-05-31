import { Router } from "express";
import {
  addWishlistHandler,
  listWishlistHandler,
  removeWishlistHandler,
  wishlistCountHandler,
} from "./wishlist.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const wishlistRouter = Router();

wishlistRouter.post("/", authMiddleware, addWishlistHandler);
wishlistRouter.delete("/:productId", authMiddleware, removeWishlistHandler);
wishlistRouter.get("/", authMiddleware, listWishlistHandler);
wishlistRouter.get("/count", authMiddleware, wishlistCountHandler);

export { wishlistRouter };
