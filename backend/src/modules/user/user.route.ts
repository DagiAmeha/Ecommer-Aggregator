import { Router } from "express";
import {
  createUserHandler,
  getMyProfileHandler,
  getUserByIdHandler,
  listUsersHandler,
  registerUserHandler,
  updateMyProfileHandler,
  updateUserRoleHandler,
} from "./user.controller";
import { authMiddleware, requireRoles } from "../../middleware/auth.middleware";

const userRouter = Router();

userRouter.post("/register", registerUserHandler);

userRouter.get("/me", authMiddleware, getMyProfileHandler);
userRouter.patch("/me", authMiddleware, updateMyProfileHandler);

userRouter.get("/", authMiddleware, requireRoles(["admin"]), listUsersHandler);
userRouter.post(
  "/",
  authMiddleware,
  requireRoles(["admin"]),
  createUserHandler,
);
userRouter.get(
  "/:id",
  authMiddleware,
  requireRoles(["admin"]),
  getUserByIdHandler,
);
userRouter.patch(
  "/:id/role",
  authMiddleware,
  requireRoles(["admin"]),
  updateUserRoleHandler,
);

export { userRouter };
