import { json, NextFunction, Request, Response } from "express";
import { logoutSchema, signInSchema, signUpSchema } from "./auth.validator";
import {
  logoutUser,
  signInWithFirebaseIdToken,
  signUpUser,
} from "./auth.service";
import { getUserByFirebaseUid } from "../user/user.service";
import { sendError, sendSuccess } from "../../utils/api-response";

export async function signUpHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = signUpSchema.parse(req.body);

    const existingUser = await getUserByFirebaseUid(payload.firebaseUid);
    if (existingUser) {
      throw new Error("User with this Firebase UID already exists");
    }

    const user = await signUpUser({
      firebase_uid: payload.firebaseUid,
      email: payload.email,
      full_name: payload.fullName,
      phone_number: payload.phoneNumber,
    });

    sendSuccess(
      res,
      {
        user,
        note: "Use user.id as your internal user reference.",
      },
      201,
    );
  } catch (error) {
    next(error);
  }
}

export async function signInHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = signInSchema.parse(req.body);
    const user = await signInWithFirebaseIdToken(payload.idToken);

    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
}

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = logoutSchema.parse(req.body ?? {});
    const firebaseUid = payload.firebaseUid;

    if (!firebaseUid) {
      sendError(
        res,
        "firebaseUid is required or provide a valid bearer token",
        400,
      );
      return;
    }

    await logoutUser(firebaseUid);
    sendSuccess(res, { revoked: true });
  } catch (error) {
    next(error);
  }
}

export async function getMeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, { user: req.user });
  } catch (error) {
    next(error);
  }
}
