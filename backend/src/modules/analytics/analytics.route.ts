import { Router } from "express";
import { optionalAuthMiddleware } from "../../middleware/auth.middleware";
import {
  recommendationsHandler,
  recordEventHandler,
  topSearchesHandler,
  trendingProductsHandler,
} from "./analytics.controller";

const analyticsRouter = Router();

analyticsRouter.post("/events", optionalAuthMiddleware, recordEventHandler);
analyticsRouter.get("/trending", trendingProductsHandler);
analyticsRouter.get("/recommendations", recommendationsHandler);
analyticsRouter.get("/top-searches", topSearchesHandler);

export { analyticsRouter };
