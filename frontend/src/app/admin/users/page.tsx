"use client";

import { useEffect, useState } from "react";
import { fetchAllUsers, updateUserStatus } from "@/services/admin.service";
import type { AdminUser } from "@/types/admin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(userId: number, newStatus: "active" | "suspended") {
    setUpdatingUserId(userId);

    try {
      await updateUserStatus(userId, newStatus);
      // Reload users to reflect changes
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user status");
    } finally {
      setUpdatingUserId(null);
    }
  }

  function getRoleValue(role: unknown): string {
    if (typeof role === "string") {
      return role;
    }
    if (role && typeof role === "object" && "value" in role) {
      return String((role as { value?: string }).value ?? "user");
    }
    return "user";
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            User Management
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            {users.length} Total Users
          </h2>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/10">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const role = getRoleValue(user.role);
                const isUpdating = updatingUserId === user.id;

                return (
                  <tr
                    key={user.id}
                    className="border-b border-black/5 transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-950">
                      {user.full_name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : role === "vendor"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {role !== "admin" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(
                              user.id,
                              user.status === "active" ? "suspended" : "active",
                            )
                          }
                          disabled={isUpdating}
                          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                            user.status === "active"
                              ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          } ${isUpdating ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          {isUpdating
                            ? "Updating..."
                            : user.status === "active"
                              ? "Suspend"
                              : "Unsuspend"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
