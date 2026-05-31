import { Router } from "express";
import { authMiddleware, requireRoles } from "../../middleware/auth.middleware";
import {
  createVendorHandler,
  deleteUserHandler,
  getAdminStatsHandler,
  getAdminUserHandler,
  listAdminUsersHandler,
  reactivateUserHandler,
  suspendUserHandler,
  updateAdminUserRoleHandler,
} from "./admin.controller";

const adminRouter = Router();

adminRouter.use(authMiddleware, requireRoles(["admin"]));

adminRouter.get("/stats", getAdminStatsHandler);
adminRouter.get("/users", listAdminUsersHandler);
adminRouter.get("/users/:id", getAdminUserHandler);
adminRouter.patch("/users/:id/role", updateAdminUserRoleHandler);
adminRouter.patch("/users/:id/suspend", suspendUserHandler);
adminRouter.patch("/users/:id/reactivate", reactivateUserHandler);
adminRouter.delete("/users/:id", deleteUserHandler);
adminRouter.post("/vendors", createVendorHandler);

export { adminRouter };
