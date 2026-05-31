import { pool } from "../../config/db";
import { firebaseAuth } from "../../config/firebase";
import { createStore } from "../store/store.service";
import { createStoreSource } from "../store/store_source.model";
import {
  createUserRecord,
  getUserByEmail,
  getUserById,
  softDeleteUserRecord,
  updateUserRoleRecord,
  updateUserStatusRecord,
} from "../user/user.service";
import type { UserRole } from "../user/user.model";

export type AdminUserStatus = "active" | "suspended";

export interface AdminUserRow {
  id: number;
  firebase_uid: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  role: string | { value?: string };
  status: AdminUserStatus;
  created_at: string;
  deleted_at: string | null;
  store_id: number | null;
  store_name: string | null;
}

export interface AdminUsersResult {
  rows: AdminUserRow[];
  total: number;
}

function buildUserFilters(filters: {
  search?: string;
  role?: string;
  status?: AdminUserStatus;
}) {
  const conditions: string[] = ["u.deleted_at IS NULL"];
  const values: Array<string | number> = [];

  if (filters.search) {
    values.push(`%${filters.search}%`);
    const index = values.length;
    conditions.push(`(u.email ILIKE $${index} OR u.full_name ILIKE $${index})`);
  }

  if (filters.role) {
    values.push(filters.role);
    conditions.push(`u.role = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`u.status = $${values.length}`);
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
}

export async function listAdminUsers(
  page = 1,
  limit = 10,
  filters: { search?: string; role?: string; status?: AdminUserStatus } = {},
): Promise<AdminUsersResult> {
  const { whereClause, values } = buildUserFilters(filters);
  const offset = (page - 1) * limit;

  const countResult = await pool.query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM users u
      ${whereClause}
    `,
    values,
  );

  const total = Number(countResult.rows[0]?.total ?? 0);

  const dataValues = values.slice();
  dataValues.push(limit, offset);

  const result = await pool.query<AdminUserRow>(
    `
      SELECT
        u.id,
        u.firebase_uid,
        u.email,
        u.full_name,
        u.phone_number,
        u.role,
        u.status,
        u.created_at::text AS created_at,
        u.deleted_at::text AS deleted_at,
        s.id AS store_id,
        s.store_name
      FROM users u
      LEFT JOIN stores s ON s.owner_id = u.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}
    `,
    dataValues,
  );

  return { rows: result.rows, total };
}

export async function getAdminUserById(
  id: number,
): Promise<AdminUserRow | null> {
  const result = await pool.query<AdminUserRow>(
    `
      SELECT
        u.id,
        u.firebase_uid,
        u.email,
        u.full_name,
        u.phone_number,
        u.role,
        u.status,
        u.created_at::text AS created_at,
        u.deleted_at::text AS deleted_at,
        s.id AS store_id,
        s.store_name
      FROM users u
      LEFT JOIN stores s ON s.owner_id = u.id
      WHERE u.id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function createVendorAccount(payload: {
  full_name: string;
  email: string;
  phone: string;
  store_name: string;
  password: string;
  source_type?: "manual" | "api" | "scraping";
  source_url?: string;
}): Promise<{ user: AdminUserRow }> {
  const existing = await getUserByEmail(payload.email);
  if (existing) {
    throw new Error("A user with this email already exists");
  }

  const firebaseUser = await firebaseAuth.createUser({
    email: payload.email,
    password: payload.password,
    displayName: payload.full_name,
  });

  const user = await createUserRecord({
    firebase_uid: firebaseUser.uid,
    email: payload.email,
    full_name: payload.full_name,
    phone_number: payload.phone,
    role: "vendor",
    provider: "password",
    status: "active",
  });

  const store = await createStore({
    owner_id: user.id,
    store_name: payload.store_name,
    description: "Vendor store managed by admin",
    is_active: true,
  });

  const sourceType = payload.source_type ?? "manual";
  if (sourceType !== "manual") {
    const sourceUrl = payload.source_url?.trim();
    if (!sourceUrl) {
      throw new Error("source_url is required for API or scraping sources");
    }

    await createStoreSource({
      store_id: store.id,
      type: sourceType,
      url: sourceUrl,
      is_active: true,
      source_name: sourceType === "scraping" ? "BooksToScrape" : null,
    });
  }

  const adminUser = await getAdminUserById(user.id);
  if (!adminUser) {
    throw new Error("Failed to load created vendor account");
  }

  return { user: adminUser };
}

export async function suspendUserAccount(id: number) {
  const user = await updateUserStatusRecord(id, "suspended");
  if (!user) {
    return null;
  }

  await firebaseAuth.updateUser(user.firebase_uid, { disabled: true });
  return getAdminUserById(id);
}

export async function reactivateUserAccount(id: number) {
  const user = await updateUserStatusRecord(id, "active");
  if (!user) {
    return null;
  }

  await firebaseAuth.updateUser(user.firebase_uid, { disabled: false });
  return getAdminUserById(id);
}

export async function deleteUserAccount(id: number) {
  const user = await softDeleteUserRecord(id);
  if (!user) {
    return null;
  }

  await firebaseAuth.updateUser(user.firebase_uid, { disabled: true });
  return getAdminUserById(id);
}

export async function updateAdminUserRole(id: number, role: UserRole) {
  const updated = await updateUserRoleRecord(id, role);
  if (!updated) {
    return null;
  }

  return getAdminUserById(id);
}

export async function getAdminStats(): Promise<{
  total_users: number;
  total_vendors: number;
  suspended_accounts: number;
}> {
  const result = await pool.query<{
    total_users: string;
    total_vendors: string;
    suspended_accounts: string;
  }>(
    `
      SELECT
        COUNT(*)::text AS total_users,
        SUM(CASE WHEN role = 'vendor' THEN 1 ELSE 0 END)::text AS total_vendors,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END)::text AS suspended_accounts
      FROM users
      WHERE deleted_at IS NULL
    `,
  );

  return {
    total_users: Number(result.rows[0]?.total_users ?? 0),
    total_vendors: Number(result.rows[0]?.total_vendors ?? 0),
    suspended_accounts: Number(result.rows[0]?.suspended_accounts ?? 0),
  };
}

export async function ensureTargetNotSelf(
  requesterId: number,
  targetId: number,
): Promise<void> {
  if (requesterId === targetId) {
    throw new Error("You cannot perform this action on your own account");
  }

  const target = await getUserById(targetId);
  if (!target) {
    throw new Error("User not found");
  }
}
