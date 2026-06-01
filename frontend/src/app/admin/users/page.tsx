"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deleteAdminUser,
  fetchAdminUsers,
  reactivateAdminUser,
  suspendAdminUser,
  updateAdminUserRole,
} from "@/services/admin.service";
import { fetchMyProfile } from "@/services/user.service";
import type { AdminUser, AdminUserRole } from "@/types/admin";
import {
  notifyError,
  notifyLoading,
  notifyUpdate,
} from "@/utils/notifications";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

function getRoleValue(role: AdminUser["role"]): string {
  if (typeof role === "string") {
    return role;
  }

  return role?.value ?? "user";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [adminId, setAdminId] = useState<number | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [limit, total]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile = await fetchMyProfile();
        if (active) {
          setAdminId(profile.id ?? null);
        }
      } catch {
        if (active) {
          setAdminId(null);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAdminUsers({
          page,
          limit,
          search: search.trim() || undefined,
          role: roleFilter === "all" ? undefined : roleFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
        });

        if (active) {
          setUsers(response.data);
          setTotal(response.pagination.total);
        }
      } catch (err) {
        if (active) {
          const message =
            err instanceof Error ? err.message : "Failed to load users";
          setError(message);
          notifyError(err, message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, [page, limit, search, roleFilter, statusFilter]);

  async function handleSuspend(user: AdminUser) {
    if (!window.confirm(`Suspend ${user.email}?`)) {
      return;
    }

    setActionId(user.id);
    const toastId = notifyLoading("Suspending user...");
    try {
      const updated = await suspendAdminUser(user.id);
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      notifyUpdate(toastId, "User suspended successfully.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to suspend user";
      setError(message);
      notifyUpdate(toastId, message, true);
    } finally {
      setActionId(null);
    }
  }

  async function handleReactivate(user: AdminUser) {
    setActionId(user.id);
    const toastId = notifyLoading("Reactivating user...");
    try {
      const updated = await reactivateAdminUser(user.id);
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      notifyUpdate(toastId, "User reactivated successfully.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reactivate user";
      setError(message);
      notifyUpdate(toastId, message, true);
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(user: AdminUser) {
    if (!window.confirm(`Delete ${user.email}?`)) {
      return;
    }

    setActionId(user.id);
    const toastId = notifyLoading("Deleting user...");
    try {
      await deleteAdminUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setTotal((prev) => Math.max(0, prev - 1));
      notifyUpdate(toastId, "User deleted successfully.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete user";
      setError(message);
      notifyUpdate(toastId, message, true);
    } finally {
      setActionId(null);
    }
  }

  async function handleRoleChange(user: AdminUser, nextRole: string) {
    if (nextRole === getRoleValue(user.role)) {
      return;
    }

    setActionId(user.id);
    const toastId = notifyLoading("Updating role...");
    try {
      const updated = await updateAdminUserRole(
        user.id,
        nextRole as AdminUserRole,
      );
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      notifyUpdate(toastId, "Role updated successfully.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update role";
      setError(message);
      notifyUpdate(toastId, message, true);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
        <input
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          placeholder="Search users by name or email"
          className="flex-1 rounded-2xl border border-black/10 px-4 py-2 text-sm outline-none"
        />
        <select
          value={roleFilter}
          onChange={(event) => {
            setPage(1);
            setRoleFilter(event.target.value);
          }}
          className="rounded-2xl border border-black/10 px-3 py-2 text-sm"
        >
          <option value="all">All roles</option>
          <option value="user">Users</option>
          <option value="vendor">Vendors</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value);
          }}
          className="rounded-2xl border border-black/10 px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm">
                    Loading users...
                  </td>
                </tr>
              ) : users.length ? (
                users.map((user) => {
                  const role = getRoleValue(user.role);
                  const isSelf = adminId === user.id;
                  const isSuspended = user.status === "suspended";

                  return (
                    <tr key={user.id} className="border-t border-black/5">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-950">
                          {user.full_name ?? "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user.store_name ? `Store: ${user.store_name}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{user.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={role}
                          onChange={(event) =>
                            handleRoleChange(user, event.target.value)
                          }
                          disabled={isSelf || actionId === user.id}
                          className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold"
                        >
                          <option value="user">User</option>
                          <option value="vendor">Vendor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isSuspended
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {isSuspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {isSuspended ? (
                            <button
                              type="button"
                              disabled={isSelf || actionId === user.id}
                              onClick={() => handleReactivate(user)}
                              className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isSelf || actionId === user.id}
                              onClick={() => handleSuspend(user)}
                              className="rounded-full border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:border-amber-400"
                            >
                              Suspend
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={isSelf || actionId === user.id}
                            onClick={() => handleDelete(user)}
                            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-400"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1}
          className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() =>
            setPage((current) => Math.min(totalPages, current + 1))
          }
          disabled={page >= totalPages}
          className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
