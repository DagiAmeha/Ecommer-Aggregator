import {
  getAllUsers,
  getAllVendors,
  getPlatformReports,
  updateUserStatus,
  updateVendorStatus,
  AdminUserView,
  AdminVendorView,
  PlatformReports,
  UserStatus,
} from "./admin.model";

/**
 * Service layer for admin operations
 */

export async function fetchAllUsers(): Promise<AdminUserView[]> {
  return getAllUsers();
}

export async function changeUserStatus(
  userId: number,
  status: UserStatus,
): Promise<boolean> {
  const user = await updateUserStatus(userId, status);
  return user !== null;
}

export async function fetchAllVendors(): Promise<AdminVendorView[]> {
  return getAllVendors();
}

export async function changeVendorStatus(
  vendorId: number,
  isActive: boolean,
): Promise<boolean> {
  return updateVendorStatus(vendorId, isActive);
}

export async function fetchPlatformReports(): Promise<PlatformReports> {
  return getPlatformReports();
}
