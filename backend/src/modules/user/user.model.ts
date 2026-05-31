import { pool } from "../../config/db";

export const USER_ROLES = ["user", "vendor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: number;
  firebase_uid: string;
  email: string;
  full_name: string | null;
  phone_number: string;
  role: { value: UserRole; default: "user" };
  status: "active" | "suspended";
  deleted_at?: string | null;
  created_at?: string;
  provider?: "password" | "google";
  profile_image?: string | null;
}

export interface Vendor {
  id: number;
  owner_id: number;
  store_name: string;
  description: string | null;
  is_active: boolean;
}

export interface CreateUserInput {
  firebase_uid: string;
  email: string;
  full_name: string;
  phone_number: string;
  role?: UserRole;
  provider?: "password" | "google";
  profile_image?: string | null;
  status?: "active" | "suspended";
  store_name?: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateUserProfileInput {
  email?: string;
  full_name?: string;
  phone_number?: string;
}

export async function createUser(data: CreateUserInput): Promise<User> {
  const result = await pool.query<User>(
    `INSERT INTO users (firebase_uid, email, full_name, phone_number, role, provider, profile_image, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, firebase_uid, email, full_name, phone_number, role, status, provider, profile_image, deleted_at::text AS deleted_at, created_at::text AS created_at`,
    [
      data.firebase_uid,
      data.email,
      data.full_name,
      data.phone_number,
      data.role ?? "user",
      data.provider ?? "password",
      data.profile_image ?? null,
      data.status ?? "active",
    ],
  );

  return result.rows[0];
}

export async function findUserByFirebaseUid(
  firebaseUid: string,
): Promise<User | null> {
  const result = await pool.query<User>(
    "SELECT id, firebase_uid, email, full_name, phone_number, role, status, provider, profile_image, deleted_at::text AS deleted_at, created_at::text AS created_at FROM users WHERE firebase_uid = $1 AND deleted_at IS NULL AND status = 'active' LIMIT 1",
    [firebaseUid],
  );

  return result.rows[0] ?? null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query<User>(
    "SELECT id, firebase_uid, email, full_name, phone_number, role, status, provider, profile_image, deleted_at::text AS deleted_at, created_at::text AS created_at FROM users WHERE email = $1 LIMIT 1",
    [email],
  );

  return result.rows[0] ?? null;
}

export async function findUserById(id: number): Promise<User | null> {
  const result = await pool.query<User>(
    "SELECT id, firebase_uid, email, full_name, phone_number, role, status, provider, profile_image, deleted_at::text AS deleted_at, created_at::text AS created_at FROM users WHERE id = $1 LIMIT 1",
    [id],
  );
  return result.rows[0] ?? null;
}

export async function listAllUsers(): Promise<User[]> {
  const result = await pool.query<User>(
    "SELECT id, firebase_uid, email, full_name, phone_number, role, status, provider, profile_image, deleted_at::text AS deleted_at, created_at::text AS created_at FROM users WHERE deleted_at IS NULL ORDER BY id ASC",
  );

  return result.rows;
}

export async function updateUserProfile(
  id: number,
  data: UpdateUserProfileInput,
): Promise<User | null> {
  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  if (typeof data.email !== "undefined") {
    fields.push(`email = $${fields.length + 1}`);
    values.push(data.email);
  }

  if (typeof data.full_name !== "undefined") {
    fields.push(`full_name = $${fields.length + 1}`);
    values.push(data.full_name ?? null);
  }

  if (typeof data.phone_number !== "undefined") {
    fields.push(`phone_number = $${fields.length + 1}`);
    values.push(data.phone_number);
  }

  if (fields.length === 0) {
    return findUserById(id);
  }

  values.push(id);

  const result = await pool.query<User>(
    `UPDATE users SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING id, firebase_uid, email, full_name, phone_number, role, status, provider, profile_image, deleted_at::text AS deleted_at, created_at::text AS created_at`,
    values,
  );

  return result.rows[0] ?? null;
}

export async function updateUserRole(
  id: number,
  role: UserRole,
): Promise<User | null> {
  const result = await pool.query<User>(
    "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, firebase_uid, email, full_name, role, status, provider, profile_image, deleted_at::text AS deleted_at, created_at::text AS created_at",
    [role, id],
  );

  return result.rows[0] ?? null;
}

export async function updateUserStatus(
  id: number,
  status: "active" | "suspended",
): Promise<User | null> {
  const result = await pool.query<User>(
    "UPDATE users SET status = $1 WHERE id = $2 RETURNING id, firebase_uid, email, full_name, phone_number, role, status, provider, profile_image, deleted_at::text AS deleted_at, created_at::text AS created_at",
    [status, id],
  );

  return result.rows[0] ?? null;
}

export async function softDeleteUser(id: number): Promise<User | null> {
  const result = await pool.query<User>(
    "UPDATE users SET deleted_at = NOW(), status = 'suspended' WHERE id = $1 RETURNING id, firebase_uid, email, full_name, phone_number, role, status, provider, profile_image, deleted_at::text AS deleted_at, created_at::text AS created_at",
    [id],
  );

  return result.rows[0] ?? null;
}
