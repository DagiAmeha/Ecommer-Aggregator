import { NextFunction, Request, Response } from "express";
import {
  createUserSchema,
  googleRegisterSchema,
  registerUserSchema,
  updateMyProfileSchema,
  updateUserRoleSchema,
} from "./user.validator";
import {
  createUserRecord,
  getAllUsers,
  getUserByEmail,
  getUserByFirebaseUid,
  getUserById,
  updateUserProfileRecord,
  updateUserRoleRecord,
} from "./user.service";
import { sendError, sendSuccess } from "../../utils/api-response";
import { firebaseAuth } from "../../config/firebase";

export async function createUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = createUserSchema.parse(req.body);

    const user = await createUserRecord(payload);
    sendSuccess(res, user, 201);
  } catch (error) {
    next(error);
  }
}

export async function registerUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorizationHeader = req.headers.authorization;

    if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
      const token = authorizationHeader.replace("Bearer ", "").trim();
      const decodedToken = await firebaseAuth.verifyIdToken(token);
      const provider = decodedToken.firebase?.sign_in_provider;

      if (provider === "google.com") {
        const payload = googleRegisterSchema.parse(req.body ?? {});

        if (!decodedToken.email) {
          sendError(res, "Google account email is missing", 400);
          return;
        }

        const fullName = decodedToken.name;
        if (!fullName) {
          sendError(res, "Google account name is missing", 400);
          return;
        }

        const existingUser = await getUserByFirebaseUid(decodedToken.uid);
        if (existingUser) {
          sendSuccess(res, existingUser);
          return;
        }

        const existingByEmail = await getUserByEmail(decodedToken.email);
        if (existingByEmail) {
          sendSuccess(res, existingByEmail);
          return;
        }

        const user = await createUserRecord({
          firebase_uid: decodedToken.uid,
          email: decodedToken.email,
          full_name: fullName,
          phone_number: payload.phone_number,
          role: "user",
          provider: "google",
          profile_image: decodedToken.picture ?? null,
        });

        sendSuccess(res, user, 201);
        return;
      }
    }

    const payload = registerUserSchema.parse(req.body);

    const user = await createUserRecord({
      firebase_uid: payload.uid,
      email: payload.email,
      full_name: payload.full_name,
      phone_number: payload.phone,
      role: "user",
      provider: "password",
    });

    sendSuccess(res, user, 201);
  } catch (error) {
    next(error);
  }
}

export async function getUserByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      sendError(res, "Invalid user id", 400);
      return;
    }

    const user = await getUserById(id);

    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

export async function listUsersHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const users = await getAllUsers();
    sendSuccess(res, users);
  } catch (error) {
    next(error);
  }
}

export async function getMyProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const currentUser = req.authUser;

    if (!currentUser) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    sendSuccess(res, currentUser);
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const currentUser = req.authUser;

    if (!currentUser) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const payload = updateMyProfileSchema.parse(req.body);
    const { password, ...profilePayload } = payload;

    if (password) {
      await firebaseAuth.updateUser(currentUser.firebase_uid, { password });
    }

    const updatedUser = await updateUserProfileRecord(
      currentUser.id,
      profilePayload,
    );

    if (!updatedUser) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, updatedUser);
  } catch (error) {
    next(error);
  }
}

export async function updateUserRoleHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      sendError(res, "Invalid user id", 400);
      return;
    }

    const payload = updateUserRoleSchema.parse(req.body);
    const updatedUser = await updateUserRoleRecord(id, payload.role);

    if (!updatedUser) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, updatedUser);
  } catch (error) {
    next(error);
  }
}
