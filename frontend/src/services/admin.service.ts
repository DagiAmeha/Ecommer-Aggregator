import { apiRequest } from "./api";
import type {
  AdminUser,
  AdminVendor,
  PlatformReports,
  UpdateUserStatusPayload,
  UpdateVendorStatusPayload,
} from "@/types/admin";

/**
 * Fetch all users in the system
 */
export async function fetchAllUsers(): Promise<AdminUser[]> {
  const response = await apiRequest<{ users: AdminUser[] }>(
    "/admin/users",
  );
  return response.users;
}

/**
 * Update user status (suspend/unsuspend)
 */
export async function updateUserStatus(
  userId: number,
  status: "active" | "suspended",
): Promise<void> {
  await apiRequest<{ message: string }>(`/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ status } as UpdateUserStatusPayload),
  });
}

/**
 * Fetch all vendors with their store information
 */
export async function fetchAllVendors(): Promise<AdminVendor[]> {
  const response = await apiRequest<{ vendors: AdminVendor[] }>(
    "/admin/vendors",
  );
  return response.vendors;
}

/**
 * Update vendor status (activate/deactivate)
 */
export async function updateVendorStatus(
  vendorId: number,
  isActive: boolean,
): Promise<void> {
  await apiRequest<{ message: string }>(`/admin/vendors/${vendorId}`, {
    method: "PUT",
    body: JSON.stringify({ is_active: isActive } as UpdateVendorStatusPayload),
  });
}

/**
 * Fetch platform-wide analytics and reports
 */
export async function fetchPlatformReports(): Promise<PlatformReports> {
  const response = await apiRequest<{ reports: PlatformReports }>(
    "/admin/reports",
  );
  return response.reports;
}
