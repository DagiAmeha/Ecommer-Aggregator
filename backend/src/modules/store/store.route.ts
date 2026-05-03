import { Router } from "express";
import {
  createStoreHandler,
  deleteStoreHandler,
  getStoreByIdHandler,
  listStoresHandler,
  updateStoreHandler,
} from "./store.controller";
import { authMiddleware, requireRoles } from "../../middleware/auth.middleware";

const storeRouter = Router();

storeRouter.get("/", listStoresHandler);
storeRouter.post(
  "/",
  authMiddleware,
  requireRoles(["admin"]),
  createStoreHandler,
);
storeRouter.get("/:id", getStoreByIdHandler);
storeRouter.put(
  "/:id",
  authMiddleware,
  requireRoles(["admin"]),
  updateStoreHandler,
);
storeRouter.delete(
  "/:id",
  authMiddleware,
  requireRoles(["admin"]),
  deleteStoreHandler,
);

export { storeRouter };
