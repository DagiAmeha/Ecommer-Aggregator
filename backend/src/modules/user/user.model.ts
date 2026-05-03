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
  store_name?: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateUserProfileInput {
  email?: string;
  full_name?: string;
}

export async function createUser(data: CreateUserInput): Promise<User> {
  const result = await pool.query<User>(
    `INSERT INTO users (firebase_uid, email, full_name, phone_number, role) 
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, firebase_uid, email, full_name, phone_number, role`,
    [
      data.firebase_uid,
      data.email,
      data.full_name,
      data.phone_number,
      data.role,
    ],
  );

  return result.rows[0];
}

export async function findUserByFirebaseUid(
  firebaseUid: string,
): Promise<User | null> {
  const result = await pool.query<User>(
    "SELECT id, firebase_uid, email, full_name, phone_number, role FROM users WHERE firebase_uid = $1 LIMIT 1",
    [firebaseUid],
  );

  return result.rows[0] ?? null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query<User>(
    "SELECT id, firebase_uid, email, full_name, phone_number, role FROM users WHERE email = $1 LIMIT 1",
    [email],
  );

  return result.rows[0] ?? null;
}

export async function findUserById(id: number): Promise<User | null> {
  const result = await pool.query<User>(
    "SELECT id, firebase_uid, email, full_name, phone_number, role FROM users WHERE id = $1 LIMIT 1",
    [id],
  );
  return result.rows[0] ?? null;
}

export async function listAllUsers(): Promise<User[]> {
  const result = await pool.query<User>(
    "SELECT id, firebase_uid, email, full_name, phone_number, role FROM users ORDER BY id ASC",
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

  if (fields.length === 0) {
    return findUserById(id);
  }

  values.push(id);

  const result = await pool.query<User>(
    `UPDATE users SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING id, firebase_uid, email, full_name, phone_number,  role`,
    values,
  );

  return result.rows[0] ?? null;
}

export async function updateUserRole(
  id: number,
  role: UserRole,
): Promise<User | null> {
  const result = await pool.query<User>(
    "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, firebase_uid, email, full_name, role",
    [role, id],
  );

  return result.rows[0] ?? null;
}
