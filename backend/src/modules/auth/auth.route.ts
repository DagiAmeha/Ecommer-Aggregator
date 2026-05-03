import { Router } from "express";
import {
  getMeHandler,
  logoutHandler,
  signInHandler,
  signUpHandler,
} from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const authRouter = Router();

authRouter.post("/signup", signUpHandler);
authRouter.post("/signin", signInHandler);
authRouter.post("/logout", authMiddleware, logoutHandler);
authRouter.get("/me", authMiddleware, getMeHandler);

export { authRouter };
