import { NextFunction, Request, Response } from "express";
import {
  createUserSchema,
  registerUserSchema,
  updateMyProfileSchema,
  updateUserRoleSchema,
} from "./user.validator";
import {
  createUserRecord,
  getAllUsers,
  getUserById,
  updateUserProfileRecord,
  updateUserRoleRecord,
} from "./user.service";
import { sendError, sendSuccess } from "../../utils/api-response";

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
    const payload = registerUserSchema.parse(req.body);

    const user = await createUserRecord({
      firebase_uid: payload.uid,
      email: payload.email,
      full_name: payload.full_name,
      phone_number: payload.phone,
      role: "user",
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
    const updatedUser = await updateUserProfileRecord(currentUser.id, payload);

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
