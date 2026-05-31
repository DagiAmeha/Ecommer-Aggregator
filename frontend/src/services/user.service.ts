import { apiRequest } from "./api";

export type UserProfile = {
  id: number;
  email: string;
  full_name?: string | null;
  phone_number?: string | null;
  role?: string | { value?: string };
};

export async function fetchMyProfile(): Promise<UserProfile> {
  return apiRequest<UserProfile>("/users/me");
}
