"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import { apiRequest } from "@/services/api";
import { getCurrentUser, subscribeToAuthChanges } from "@/services/auth.service";
import { ProductImage } from "@/components/ProductImage";

function isValidEthiopianPhone(digits: string): boolean {
  return /^9\d{8}$/.test(digits);
}

function getProfileErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    const message = error.message.toLowerCase();
    if (message.includes("unauthorized")) {
      return "Your session expired. Please sign in again.";
    }
    if (message.includes("invalid token")) {
      return "Your session expired. Please try again.";
    }
    if (message.includes("phone")) {
      return "Enter a valid Ethiopian mobile number after +251.";
    }
    if (message.includes("network") || message.includes("failed to fetch")) {
      return "Network error. Check your connection and try again.";
    }
    return error.message;
  }

  return fallback;
}

export default function GoogleCompleteProfilePage() {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(getCurrentUser);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Complete Profile | Aggregator Market";
  }, []);

  useEffect(() => {
    return subscribeToAuthChanges((user) => setFirebaseUser(user));
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!firebaseUser) {
      setError("Your Google session has expired. Please sign in again.");
      return;
    }

    if (!firebaseUser.email || !firebaseUser.displayName) {
      setError("Google profile data is missing. Please sign in again.");
      return;
    }

    if (!isValidEthiopianPhone(phoneDigits)) {
      setError("Enter a valid Ethiopian mobile number after +251.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        phone_number: `+251${phoneDigits}`,
      };

      const response = await apiRequest<{ role?: string | { value?: string } }>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      const role =
        typeof response.role === "string"
          ? response.role
          : (response.role as { value?: string } | undefined)?.value;

      router.push(role === "vendor" ? "/vendor/dashboard" : "/products");
    } catch (err) {
      setError(getProfileErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  }

  const displayName = firebaseUser?.displayName ?? "";
  const email = firebaseUser?.email ?? "";
  const profileImage = firebaseUser?.photoURL ?? "";

  return (
    <section className="mx-auto grid max-w-md gap-6 rounded-2xl border border-black/10 bg-white/80 p-8 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
      <div className="flex items-center gap-3">
        {profileImage ? (
          <ProductImage
            src={profileImage}
            alt="Google profile"
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
            {displayName ? displayName[0]?.toUpperCase() : "G"}
          </div>
        )}
        <div>
          <p className="display-font text-2xl font-semibold text-slate-950">
            Complete your profile
          </p>
          <p className="text-sm text-slate-500">
            We just need your phone number to finish setup.
          </p>
        </div>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={displayName}
            readOnly
            className="w-full cursor-not-allowed rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm text-slate-600"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            readOnly
            className="w-full cursor-not-allowed rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm text-slate-600"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="phone">
            Phone Number
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
                setPhoneDigits(event.target.value.replace(/\D/g, "").slice(0, 9))
              }
              placeholder="912345678"
              className="w-full px-4 py-3 text-sm outline-none placeholder:text-slate-400"
              required
            />
          </div>
          <p className="text-xs text-slate-500">Final format: +251XXXXXXXXX</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Saving..." : "Finish setup"}
        </button>
        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
