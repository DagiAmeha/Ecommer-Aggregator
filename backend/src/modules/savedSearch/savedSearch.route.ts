import { Router } from "express";
import {
  createSavedSearchHandler,
  deleteSavedSearchHandler,
  listSavedSearchesHandler,
} from "./savedSearch.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const savedSearchRouter = Router();

savedSearchRouter.post("/", authMiddleware, createSavedSearchHandler);
savedSearchRouter.get("/", authMiddleware, listSavedSearchesHandler);
savedSearchRouter.delete("/:id", authMiddleware, deleteSavedSearchHandler);

export { savedSearchRouter };
