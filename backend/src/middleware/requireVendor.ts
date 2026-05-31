import { NextFunction, Request, Response } from "express";
import { firebaseAuth } from "../config/firebase";
import { getUserByFirebaseUid } from "../modules/user/user.service";
import { sendError } from "../utils/api-response";

export async function requireVendor(
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

    const role =
      typeof user.role === "string" ? user.role : (user.role as any)?.value;

    if (role !== "vendor") {
      sendError(res, "Forbidden: vendor access only", 403);
      return;
    }

    req.user = user;
    req.authUser = user;
    next();
  } catch {
    sendError(res, "Unauthorized: invalid token", 401);
  }
}
