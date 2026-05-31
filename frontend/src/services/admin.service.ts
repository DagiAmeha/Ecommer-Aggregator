import { apiRequest } from "./api";
import type {
  AdminStats,
  AdminUsersPayload,
  AdminUser,
  CreateVendorPayload,
  CreateVendorResponse,
  AdminUserRole,
} from "@/types/admin";

export async function fetchAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>("/admin/stats");
}

export async function fetchAdminUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}): Promise<AdminUsersPayload> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.role) searchParams.set("role", params.role);
  if (params.status) searchParams.set("status", params.status);

  const query = searchParams.toString();
  return apiRequest<AdminUsersPayload>(
    `/admin/users${query ? `?${query}` : ""}`,
  );
}

export async function fetchAdminUser(id: number): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/users/${id}`);
}

export async function suspendAdminUser(id: number): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/users/${id}/suspend`, {
    method: "PATCH",
  });
}

export async function reactivateAdminUser(id: number): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/users/${id}/reactivate`, {
    method: "PATCH",
  });
}

export async function deleteAdminUser(id: number): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/users/${id}`, {
    method: "DELETE",
  });
}

export async function updateAdminUserRole(
  id: number,
  role: AdminUserRole,
): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function createVendorAccount(
  payload: CreateVendorPayload,
): Promise<CreateVendorResponse> {
  return apiRequest<CreateVendorResponse>("/admin/vendors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
