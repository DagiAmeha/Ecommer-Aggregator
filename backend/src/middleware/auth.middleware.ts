import { NextFunction, Request, Response } from "express";
import { firebaseAuth } from "../config/firebase";
import { getUserByFirebaseUid } from "../modules/user/user.service";
import { UserRole } from "../modules/user/user.model";
import { User } from "../modules/user/user.model";
import { sendError } from "../utils/api-response";

declare global {
  namespace Express {
    interface Request {
      user?: User; // Use your User type here
    }
  }
}
export async function authMiddleware(
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

    let user = await getUserByFirebaseUid(decoded.uid);

    if (!user) {
      sendError(res, "Unauthorized: user not found", 401);
      return;
    }

    req.user = user;
    next();
  } catch {
    sendError(res, "Unauthorized: invalid token", 401);
  }
}

export function requireRoles(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const roleOrObj = req.user?.role;
    const role =
      typeof roleOrObj === "string" ? roleOrObj : (roleOrObj as any)?.value;
    console.log("User role:", role);
    if (!role) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    if (!allowedRoles.includes(role as UserRole)) {
      sendError(res, "Forbidden: insufficient role permissions", 403);
      return;
    }

    next();
  };
}
