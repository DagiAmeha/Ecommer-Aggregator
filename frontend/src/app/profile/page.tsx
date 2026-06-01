"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyProfile, updateMyProfile } from "@/services/user.service";
import type {
  UserProfile,
  UpdateProfilePayload,
} from "@/services/user.service";

function normalizePhoneDigits(phoneNumber?: string | null): string {
  if (!phoneNumber) return "";

  if (phoneNumber.startsWith("+251")) {
    return phoneNumber.slice(4);
  }

  if (phoneNumber.startsWith("09") && phoneNumber.length === 10) {
    return phoneNumber.slice(1);
  }

  return phoneNumber.replace(/\D/g, "").slice(-9);
}

function isValidEthiopianPhone(digits: string): boolean {
  return /^9\d{8}$/.test(digits);
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Profile | Aggregator Market";
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user) return;

      try {
        const data = await fetchMyProfile();
        if (!active) return;

        setProfile(data);
        setFullName(data.full_name ?? "");
        setPhoneDigits(normalizePhoneDigits(data.phone_number));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load profile");
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [user]);

  const canSave = useMemo(() => {
    if (!profile) return false;

    const trimmedName = fullName.trim();
    const trimmedPhone = phoneDigits.trim();
    const nameChanged = trimmedName !== (profile.full_name ?? "");
    const phoneChanged =
      trimmedPhone !== normalizePhoneDigits(profile.phone_number);

    return nameChanged || phoneChanged || password.trim().length > 0;
  }, [fullName, phoneDigits, password, profile]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = fullName.trim();
    const trimmedPhone = phoneDigits.trim();
    const trimmedPassword = password.trim();
    const payload: UpdateProfilePayload = {};

    if (trimmedName) {
      payload.full_name = trimmedName;
    }

    if (trimmedPhone) {
      if (!isValidEthiopianPhone(trimmedPhone)) {
        setError("Enter a valid Ethiopian mobile number after +251.");
        return;
      }
      payload.phone_number = `+251${trimmedPhone}`;
    }

    if (trimmedPassword) {
      if (trimmedPassword.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (trimmedPassword !== confirmPassword.trim()) {
        setError("Passwords do not match.");
        return;
      }
      payload.password = trimmedPassword;
    }

    if (!Object.keys(payload).length) {
      setError("Update at least one field before saving.");
      return;
    }

    setSaving(true);

    try {
      const updated = await updateMyProfile(payload);
      setProfile(updated);
      setFullName(updated.full_name ?? "");
      setPhoneDigits(normalizePhoneDigits(updated.phone_number));
      setPassword("");
      setConfirmPassword("");
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading || (!user && !error)) {
    return (
      <section className="mx-auto max-w-xl rounded-2xl border border-black/10 bg-white/80 p-8 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
        <p className="text-sm text-slate-500">Loading profile...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-black/10 bg-white/80 p-8 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
      <div>
        <p className="display-font text-3xl font-semibold text-slate-950">
          Profile settings
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Update your name, phone number, and password.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={profile?.email ?? ""}
            readOnly
            className="w-full cursor-not-allowed rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm text-slate-600"
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="fullName"
          >
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Enter your full name"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="phone">
            Phone number
          </label>
          <div className="flex overflow-hidden rounded-2xl border border-black/10 bg-white focus-within:border-emerald-600">
            <span className="flex items-center gap-2 border-r border-black/10 bg-slate-50 px-4 text-sm font-semibold text-slate-700">
              <span aria-hidden="true">🇪🇹</span>
              +251
            </span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              maxLength={9}
              value={phoneDigits}
              onChange={(event) =>
                setPhoneDigits(
                  event.target.value.replace(/\D/g, "").slice(0, 9),
                )
              }
              placeholder="912345678"
              className="w-full px-4 py-3 text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <p className="text-xs text-slate-500">Final format: +251XXXXXXXXX</p>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="password"
          >
            New password
          </label>
          <div className="flex overflow-hidden rounded-2xl border border-black/10 bg-white focus-within:border-emerald-600">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Leave blank to keep current password"
              className="w-full px-4 py-3 text-sm outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="px-4 text-slate-500 transition hover:text-slate-800"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="confirmPassword"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter new password"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
          />
        </div>

        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving || !canSave}
          className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </section>
  );
}
