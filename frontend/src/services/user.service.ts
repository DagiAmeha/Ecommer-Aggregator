import { apiRequest } from "./api";

export type UserProfile = {
  id: number;
  email: string;
  full_name?: string | null;
  phone_number?: string | null;
  role?: string | { value?: string };
};

export type UpdateProfilePayload = {
  full_name?: string;
  phone_number?: string;
  password?: string;
};

export async function fetchMyProfile(): Promise<UserProfile> {
  return apiRequest<UserProfile>("/users/me");
}

export async function updateMyProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  return apiRequest<UserProfile>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
