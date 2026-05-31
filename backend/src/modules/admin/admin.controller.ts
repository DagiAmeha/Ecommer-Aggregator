import { NextFunction, Request, Response } from "express";
import { sendError, sendSuccess } from "../../utils/api-response";
import {
  adminCreateVendorSchema,
  adminListUsersQuerySchema,
  adminUpdateRoleSchema,
  adminUserIdParamsSchema,
} from "./admin.validator";
import {
  createVendorAccount,
  deleteUserAccount,
  ensureTargetNotSelf,
  getAdminStats,
  getAdminReports,
  getAdminUserById,
  listAdminUsers,
  reactivateUserAccount,
  suspendUserAccount,
  updateAdminUserRole,
} from "./admin.service";

export async function listAdminUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = adminListUsersQuerySchema.parse(req.query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const result = await listAdminUsers(page, limit, {
      search: query.search,
      role: query.role,
      status: query.status,
    });

    sendSuccess(res, {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: result.total,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = adminUserIdParamsSchema.parse(req.params);
    const user = await getAdminUserById(params.id);

    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

export async function createVendorHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = adminCreateVendorSchema.parse(req.body);
    const created = await createVendorAccount(payload);
    sendSuccess(res, created, 201);
  } catch (error) {
    next(error);
  }
}

export async function suspendUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = adminUserIdParamsSchema.parse(req.params);
    const requesterId = req.authUser?.id;

    if (!requesterId) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    await ensureTargetNotSelf(requesterId, params.id);
    const updated = await suspendUserAccount(params.id);

    if (!updated) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, updated);
  } catch (error) {
    if (error instanceof Error && error.message.includes("your own account")) {
      sendError(res, error.message, 400);
      return;
    }
    next(error);
  }
}

export async function reactivateUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = adminUserIdParamsSchema.parse(req.params);
    const requesterId = req.authUser?.id;

    if (!requesterId) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    await ensureTargetNotSelf(requesterId, params.id);
    const updated = await reactivateUserAccount(params.id);

    if (!updated) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, updated);
  } catch (error) {
    if (error instanceof Error && error.message.includes("your own account")) {
      sendError(res, error.message, 400);
      return;
    }
    next(error);
  }
}

export async function deleteUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = adminUserIdParamsSchema.parse(req.params);
    const requesterId = req.authUser?.id;

    if (!requesterId) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    await ensureTargetNotSelf(requesterId, params.id);
    const updated = await deleteUserAccount(params.id);

    if (!updated) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, updated);
  } catch (error) {
    if (error instanceof Error && error.message.includes("your own account")) {
      sendError(res, error.message, 400);
      return;
    }
    next(error);
  }
}

export async function updateAdminUserRoleHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = adminUserIdParamsSchema.parse(req.params);
    const payload = adminUpdateRoleSchema.parse(req.body);
    const requesterId = req.authUser?.id;

    if (!requesterId) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    await ensureTargetNotSelf(requesterId, params.id);
    const updated = await updateAdminUserRole(params.id, payload.role);

    if (!updated) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, updated);
  } catch (error) {
    if (error instanceof Error && error.message.includes("your own account")) {
      sendError(res, error.message, 400);
      return;
    }
    next(error);
  }
}

export async function getAdminStatsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stats = await getAdminStats();
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
}

export async function getAdminReportsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const reports = await getAdminReports();
    sendSuccess(res, reports);
  } catch (error) {
    next(error);
  }
}
