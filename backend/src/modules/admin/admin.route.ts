import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin";
import {
  getUsers,
  updateUser,
  getVendors,
  updateVendor,
  getReports,
} from "./admin.controller";

export const adminRouter = Router();

/**
 * All admin routes are protected by requireAdmin middleware
 * which verifies the user has 'admin' role
 */

// User management routes
adminRouter.get("/users", requireAdmin, getUsers);
adminRouter.put("/users/:id", requireAdmin, updateUser);

// Vendor tracking routes
adminRouter.get("/vendors", requireAdmin, getVendors);
adminRouter.put("/vendors/:id", requireAdmin, updateVendor);

// Platform reports route
adminRouter.get("/reports", requireAdmin, getReports);
