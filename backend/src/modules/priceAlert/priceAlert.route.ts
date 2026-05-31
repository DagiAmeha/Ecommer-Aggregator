import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  getPriceAlertForProductHandler,
  listPriceAlertsHandler,
  setPriceAlertHandler,
} from "./priceAlert.controller";

const priceAlertRouter = Router();

priceAlertRouter.use(authMiddleware);
priceAlertRouter.get("/", listPriceAlertsHandler);
priceAlertRouter.get("/product/:productId", getPriceAlertForProductHandler);
priceAlertRouter.post("/", setPriceAlertHandler);

export { priceAlertRouter };
