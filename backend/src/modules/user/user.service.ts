import {
  createUser,
  CreateUserInput,
  findUserByEmail,
  findUserByFirebaseUid,
  findUserById,
  listAllUsers,
  updateUserProfile,
  updateUserRole,
  UpdateUserProfileInput,
  updateUserStatus,
  softDeleteUser,
  User,
  UserRole,
} from "./user.model";
import { pool } from "../../config/db";

export async function createUserRecord(
  payload: CreateUserInput,
): Promise<User> {
  return createUser(payload);
}

export async function getUserByFirebaseUid(
  firebaseUid: string,
): Promise<User | null> {
  return findUserByFirebaseUid(firebaseUid);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return findUserByEmail(email);
}

export async function getUserById(id: number): Promise<User | null> {
  return findUserById(id);
}

export async function getAllUsers(): Promise<User[]> {
  return listAllUsers();
}

export async function updateUserProfileRecord(
  id: number,
  payload: UpdateUserProfileInput,
): Promise<User | null> {
  return updateUserProfile(id, payload);
}

export async function updateUserRoleRecord(
  id: number,
  role: UserRole,
): Promise<User | null> {
  if (role !== "vendor") {
    return updateUserRole(id, role);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query<User>(
      `
        UPDATE users
        SET role = $1
        WHERE id = $2
        RETURNING id, firebase_uid, email, full_name, phone_number, role, status, provider, profile_image, deleted_at::text AS deleted_at, created_at::text AS created_at
      `,
      [role, id],
    );

    const updatedUser = result.rows[0] ?? null;
    if (!updatedUser) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `
        INSERT INTO stores (owner_id, store_name, description, is_active)
        SELECT $1, $2, $3, true
        WHERE NOT EXISTS (
          SELECT 1 FROM stores WHERE owner_id = $1
        )
      `,
      [
        id,
        `${updatedUser.full_name || "Vendor"}'s Store`,
        "Vendor store managed by admin",
      ],
    );

    await client.query("COMMIT");
    return updatedUser;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateUserStatusRecord(
  id: number,
  status: "active" | "suspended",
): Promise<User | null> {
  return updateUserStatus(id, status);
}

export async function softDeleteUserRecord(id: number): Promise<User | null> {
  return softDeleteUser(id);
}
