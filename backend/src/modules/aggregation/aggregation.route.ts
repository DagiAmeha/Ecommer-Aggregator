import { Router } from "express";
import { importProductsFromSources } from "./aggregation.controller";

const aggregationRouter = Router();

aggregationRouter.post("/import", importProductsFromSources);

export { aggregationRouter };
