import { Router } from "express";
import { requireVendor } from "../../middleware/requireVendor";
import {
  createVendorProductHandler,
  deleteVendorProductHandler,
  getVendorDashboardStatsHandler,
  getVendorProductHandler,
  getVendorStoreProfileHandler,
  getVendorStoreSourceTypeHandler,
  listVendorProductsHandler,
  updateVendorStoreProfileHandler,
  updateVendorStoreSourceHandler,
  updateVendorProductHandler,
} from "./vendor.controller";

const vendorRouter = Router();

vendorRouter.use(requireVendor);

vendorRouter.get("/products", listVendorProductsHandler);
vendorRouter.get("/products/:id", getVendorProductHandler);
vendorRouter.post("/products", createVendorProductHandler);
vendorRouter.put("/products/:id", updateVendorProductHandler);
vendorRouter.delete("/products/:id", deleteVendorProductHandler);
vendorRouter.get("/dashboard/stats", getVendorDashboardStatsHandler);
vendorRouter.get("/store", getVendorStoreProfileHandler);
vendorRouter.put("/store", updateVendorStoreProfileHandler);
vendorRouter.get("/store/source", getVendorStoreSourceTypeHandler);
vendorRouter.put("/store/source", updateVendorStoreSourceHandler);

export { vendorRouter };
