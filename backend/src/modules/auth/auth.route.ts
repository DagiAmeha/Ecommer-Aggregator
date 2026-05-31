import { Router } from "express";
import {
  getMeHandler,
  googleLoginHandler,
  logoutHandler,
  signInHandler,
  signUpHandler,
} from "./auth.controller";
import { registerUserHandler } from "../user/user.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const authRouter = Router();

authRouter.post("/signup", signUpHandler);
authRouter.post("/signin", signInHandler);
authRouter.post("/google-login", googleLoginHandler);
authRouter.post("/register", registerUserHandler);
authRouter.post("/logout", authMiddleware, logoutHandler);
authRouter.get("/me", authMiddleware, getMeHandler);

export { authRouter };
