import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../utils/api-response";
import {
  fetchAllUsers,
  changeUserStatus,
  fetchAllVendors,
  changeVendorStatus,
  fetchPlatformReports,
} from "./admin.service";
import { UserStatus } from "./admin.model";

/**
 * GET /admin/users
 * Fetch all users in the system
 */
export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await fetchAllUsers();
    sendSuccess(res, { users });
  } catch (error) {
    console.error("Error fetching users:", error);
    sendError(res, "Failed to fetch users", 500);
  }
}

/**
 * PUT /admin/users/:id
 * Update user status (suspend/unsuspend)
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const userIdParam = req.params.id;
    if (Array.isArray(userIdParam)) {
      sendError(res, "Invalid user ID", 400);
      return;
    }

    const userId = parseInt(userIdParam, 10);
    const { status } = req.body as { status: UserStatus };

    if (isNaN(userId)) {
      sendError(res, "Invalid user ID", 400);
      return;
    }

    if (!status || !["active", "suspended"].includes(status)) {
      sendError(res, "Invalid status. Must be 'active' or 'suspended'", 400);
      return;
    }

    const success = await changeUserStatus(userId, status);

    if (!success) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, { message: `User status updated to ${status}` });
  } catch (error) {
    console.error("Error updating user:", error);
    sendError(res, "Failed to update user", 500);
  }
}

/**
 * GET /admin/vendors
 * Fetch all vendors with their store information
 */
export async function getVendors(req: Request, res: Response): Promise<void> {
  try {
    const vendors = await fetchAllVendors();
    sendSuccess(res, { vendors });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    sendError(res, "Failed to fetch vendors", 500);
  }
}

/**
 * PUT /admin/vendors/:id
 * Update vendor status (approve/reject/activate/deactivate)
 */
export async function updateVendor(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const vendorIdParam = req.params.id;
    if (Array.isArray(vendorIdParam)) {
      sendError(res, "Invalid vendor ID", 400);
      return;
    }

    const vendorId = parseInt(vendorIdParam, 10);
    const { is_active } = req.body as { is_active: boolean };

    if (isNaN(vendorId)) {
      sendError(res, "Invalid vendor ID", 400);
      return;
    }

    if (typeof is_active !== "boolean") {
      sendError(res, "Invalid is_active value. Must be boolean", 400);
      return;
    }

    const success = await changeVendorStatus(vendorId, is_active);

    if (!success) {
      sendError(res, "Vendor not found", 404);
      return;
    }

    sendSuccess(res, {
      message: `Vendor ${is_active ? "activated" : "deactivated"}`,
    });
  } catch (error) {
    console.error("Error updating vendor:", error);
    sendError(res, "Failed to update vendor", 500);
  }
}

/**
 * GET /admin/reports
 * Fetch platform-wide analytics and reports
 */
export async function getReports(req: Request, res: Response): Promise<void> {
  try {
    const reports = await fetchPlatformReports();
    sendSuccess(res, { reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    sendError(res, "Failed to fetch reports", 500);
  }
}
