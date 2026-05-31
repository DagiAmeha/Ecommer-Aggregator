/**
 * Admin-specific types for the admin dashboard
 */

export type UserStatus = "active" | "suspended";
export type UserRole = "user" | "vendor" | "admin";

export interface AdminUser {
  id: number;
  firebase_uid: string;
  email: string;
  full_name: string | null;
  phone_number: string;
  role: { value: UserRole; default: "user" };
  provider?: "password" | "google";
  profile_image?: string | null;
  status: UserStatus;
  created_at: string;
}

export interface AdminVendor {
  id: number;
  store_name: string;
  description: string | null;
  owner_id: number;
  owner_email: string;
  owner_name: string | null;
  is_active: boolean;
  created_at: string;
  total_products: number;
}

export interface PlatformReports {
  total_users: number;
  total_vendors: number;
  total_products: number;
  total_reviews: number;
  active_users_last_30_days: number;
  new_users_last_7_days: number;
  pending_vendors: number;
  recent_activity: RecentActivity[];
}

export interface RecentActivity {
  id: number;
  type: "user_registered" | "vendor_created" | "product_added" | "review_posted";
  description: string;
  timestamp: string;
}

export interface UpdateUserStatusPayload {
  status: UserStatus;
}

export interface UpdateVendorStatusPayload {
  is_active: boolean;
}
