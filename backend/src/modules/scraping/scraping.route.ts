import { Router } from "express";
import { requireVendor } from "../../middleware/requireVendor";
import { syncScrapingSourceHandler } from "./scraping.controller";

const scrapingRouter = Router();

scrapingRouter.use(requireVendor);
scrapingRouter.post("/sync/:sourceId", syncScrapingSourceHandler);

export { scrapingRouter };
