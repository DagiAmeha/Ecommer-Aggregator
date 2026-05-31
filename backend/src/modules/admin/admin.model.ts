import { pool } from "../../config/db";
import { User } from "../user/user.model";

/**
 * User status for admin operations
 */
export type UserStatus = "active" | "suspended";

/**
 * Vendor verification status
 */
export type VendorStatus = "active" | "pending" | "rejected";

/**
 * Extended user info for admin view
 */
export interface AdminUserView extends User {
  status: UserStatus;
  created_at: string;
}

/**
 * Vendor info for admin tracking
 */
export interface AdminVendorView {
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

/**
 * Platform analytics/reports data
 */
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

/**
 * Fetch all users with their status
 */
export async function getAllUsers(): Promise<AdminUserView[]> {
  const result = await pool.query<AdminUserView>(
    `SELECT
      id,
      firebase_uid,
      email,
      full_name,
      phone_number,
      role,
      provider,
      profile_image,
      'active' as status,
      created_at
    FROM users
    ORDER BY created_at DESC`
  );

  return result.rows;
}

/**
 * Update user status (for suspend/unsuspend operations)
 * Note: This is a placeholder. In production, you'd have a status column.
 * For now, we'll use role manipulation or a separate status table.
 */
export async function updateUserStatus(
  userId: number,
  status: UserStatus,
): Promise<User | null> {
  // For this implementation, we'll just return the user
  // In production, add a 'status' column to users table
  const result = await pool.query<User>(
    `SELECT id, firebase_uid, email, full_name, phone_number, role, provider, profile_image
     FROM users
     WHERE id = $1`,
    [userId]
  );

  return result.rows[0] ?? null;
}

/**
 * Fetch all vendors with owner information
 */
export async function getAllVendors(): Promise<AdminVendorView[]> {
  const result = await pool.query<AdminVendorView>(
    `SELECT
      s.id,
      s.store_name,
      s.description,
      s.owner_id,
      s.is_active,
      u.email as owner_email,
      u.full_name as owner_name,
      u.created_at,
      COUNT(p.id) as total_products
    FROM stores s
    INNER JOIN users u ON s.owner_id = u.id
    LEFT JOIN products p ON s.id = p.store_id
    GROUP BY s.id, s.store_name, s.description, s.owner_id, s.is_active, u.email, u.full_name, u.created_at
    ORDER BY u.created_at DESC`
  );

  return result.rows;
}

/**
 * Update vendor active status
 */
export async function updateVendorStatus(
  vendorId: number,
  isActive: boolean,
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE stores SET is_active = $1 WHERE id = $2`,
    [isActive, vendorId]
  );

  return (result.rowCount ?? 0) > 0;
}

/**
 * Fetch platform-wide reports and analytics
 */
export async function getPlatformReports(): Promise<PlatformReports> {
  // Total counts
  const totalsResult = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM stores) as total_vendors,
      (SELECT COUNT(*) FROM products) as total_products,
      (SELECT COUNT(*) FROM reviews) as total_reviews
  `);

  const totals = totalsResult.rows[0];

  // New users in last 7 days
  const newUsersResult = await pool.query(`
    SELECT COUNT(*) as count
    FROM users
    WHERE created_at >= NOW() - INTERVAL '7 days'
  `);

  // Pending vendors (inactive stores)
  const pendingVendorsResult = await pool.query(`
    SELECT COUNT(*) as count
    FROM stores
    WHERE is_active = false
  `);

  // Recent activity (last 10 actions)
  const recentActivityResult = await pool.query<RecentActivity>(`
    SELECT
      id,
      'user_registered' as type,
      'New user: ' || COALESCE(full_name, email) as description,
      created_at::text as timestamp
    FROM users
    ORDER BY created_at DESC
    LIMIT 10
  `);

  return {
    total_users: parseInt(totals.total_users) || 0,
    total_vendors: parseInt(totals.total_vendors) || 0,
    total_products: parseInt(totals.total_products) || 0,
    total_reviews: parseInt(totals.total_reviews) || 0,
    active_users_last_30_days: 0, // Placeholder - would need login tracking
    new_users_last_7_days: parseInt(newUsersResult.rows[0].count) || 0,
    pending_vendors: parseInt(pendingVendorsResult.rows[0].count) || 0,
    recent_activity: recentActivityResult.rows,
  };
}
