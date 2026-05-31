import { NextFunction, Request, Response } from "express";
import { firebaseAuth } from "../config/firebase";
import { getUserByFirebaseUid } from "../modules/user/user.service";
import { sendError } from "../utils/api-response";

/**
 * Middleware to enforce admin-only access.
 * Verifies Firebase token and checks if the user has 'admin' role.
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      sendError(res, "Unauthorized: missing bearer token", 401);
      return;
    }

    const token = authorizationHeader.replace("Bearer ", "").trim();
    const decoded = await firebaseAuth.verifyIdToken(token);
    const user = await getUserByFirebaseUid(decoded.uid);

    if (!user) {
      sendError(res, "Unauthorized: user not found", 401);
      return;
    }

    // Extract role value (handles both string and object format)
    const role =
      typeof user.role === "string" ? user.role : (user.role as any)?.value;

    if (role !== "admin") {
      sendError(res, "Forbidden: admin access only", 403);
      return;
    }

    req.user = user;
    req.authUser = user;
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    sendError(res, "Unauthorized: invalid token", 401);
  }
}
