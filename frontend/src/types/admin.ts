export type AdminUserStatus = "active" | "suspended";
export type AdminUserRole = "user" | "vendor" | "admin";

export interface AdminUser {
  id: number;
  firebase_uid: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  role: AdminUserRole | { value?: AdminUserRole };
  status: AdminUserStatus;
  created_at: string;
  deleted_at?: string | null;
  store_id?: number | null;
  store_name?: string | null;
}

export interface AdminUsersPayload {
  data: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface AdminStats {
  total_users: number;
  total_vendors: number;
  suspended_accounts: number;
}

export interface CreateVendorPayload {
  full_name: string;
  email: string;
  phone: string;
  store_name: string;
  password: string;
  source_type?: "manual" | "api" | "scraping";
  source_url?: string;
}

export interface CreateVendorResponse {
  user: AdminUser;
  temporary_password?: string;
}
