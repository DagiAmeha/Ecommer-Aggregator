"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/services/firebase";
import { fetchMyProfile } from "@/services/user.service";
import { apiRequest } from "@/services/api";
import { signInWithGooglePopup } from "@/services/auth.service";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-2"
    >
      <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-2"
    >
      <path d="M2 2l20 20" />
      <path d="M10.58 10.59A3 3 0 0 0 12 15" />
      <path d="M9.88 5.09A10.81 10.81 0 0 1 12 5c5.5 0 9 7 9 7a18.4 18.4 0 0 1-3.18 4.14" />
      <path d="M6.1 6.1C3.7 8.15 2 12 2 12s3.5 7 10 7a11.2 11.2 0 0 0 4.25-.82" />
    </svg>
  );
}

function getAuthMessage(error: unknown, fallback: string): string {
  const code = (error as { code?: string } | null)?.code;

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was canceled.";
    case "auth/cancelled-popup-request":
      return "Google sign-in was canceled.";
    case "auth/popup-blocked":
      return "Popup blocked. Please allow popups and try again.";
    default:
      if (error instanceof Error && error.message) {
        const message = error.message.toLowerCase();
        if (message.includes("unauthorized")) {
          return "Your session expired. Please sign in again.";
        }
        if (message.includes("invalid token")) {
          return "Your session expired. Please try again.";
        }
        if (
          message.includes("network") ||
          message.includes("failed to fetch")
        ) {
          return "Network error. Check your connection and try again.";
        }
        return error.message;
      }
      return fallback;
  }
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.282 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.946 3.038l5.657-5.657C34.247 6.053 29.443 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917Z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.946 3.038l5.657-5.657C34.247 6.053 29.443 4 24 4c-7.938 0-14.791 4.493-17.694 10.691Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.304 0 10.116-2.033 13.741-5.33l-6.343-5.374C29.351 34.111 26.9 35 24 35c-5.26 0-9.619-3.317-11.293-7.946l-6.522 5.025C8.999 39.088 15.78 44 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a11.99 11.99 0 0 1-4.905 5.296l.004-.003 6.343 5.374C36.296 39.186 44 33 44 24c0-1.341-.138-2.65-.389-3.917Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Login | Aggregator Market";
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      const profile = await fetchMyProfile();
      const role =
        typeof profile.role === "string"
          ? profile.role
          : (profile.role as { value?: string } | undefined)?.value;
      if (role === "admin") {
        router.push("/admin");
      } else if (role === "vendor") {
        router.push("/vendor/dashboard");
      } else {
        router.push("/products");
      }
    } catch (err) {
      setError(getAuthMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleContinue(): Promise<void> {
    setGoogleLoading(true);
    setError(null);

    try {
      await signInWithGooglePopup();
      const response = await apiRequest<{
        exists: boolean;
        user?: { role?: string | { value?: string } };
        role?: string | { value?: string };
      }>("/auth/google-login", { method: "POST" });

      if (!response.exists) {
        router.push("/auth/google-complete-profile");
        return;
      }

      const roleValue =
        typeof response.role === "string"
          ? response.role
          : (response.role as { value?: string } | undefined)?.value;
      const fallbackRole =
        typeof response.user?.role === "string"
          ? response.user?.role
          : (response.user?.role as { value?: string } | undefined)?.value;
      const role = roleValue ?? fallbackRole;

      if (role === "admin") {
        router.push("/admin");
      } else if (role === "vendor") {
        router.push("/vendor/dashboard");
      } else {
        router.push("/products");
      }
    } catch (err) {
      setError(getAuthMessage(err, "Google sign-in failed"));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-md gap-6 rounded-2xl border border-black/10 bg-white/80 p-8 shadow-[0_4px_16px_rgba(16,35,30,0.05)]">
      <div>
        <p className="display-font text-3xl font-semibold text-slate-950">
          Welcome back
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="loginEmail"
          >
            Email
          </label>
          <input
            id="loginEmail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
            required
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="loginPassword"
          >
            Password
          </label>
          <div className="flex overflow-hidden rounded-2xl border border-black/10 bg-white focus-within:border-emerald-600">
            <input
              id="loginPassword"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 text-sm outline-none placeholder:text-slate-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="px-4 text-slate-500 transition hover:text-slate-800"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
        <div className="pt-2">
          <div className="relative flex items-center justify-center">
            <span className="absolute inset-x-0 top-1/2 h-px bg-black/10" />
            <span className="relative bg-white px-3 text-[10px] uppercase tracking-[0.32em] text-slate-400">
              or
            </span>
          </div>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleGoogleContinue}
              disabled={googleLoading}
              className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-[0_3px_12px_rgba(16,35,30,0.05)] transition hover:border-black/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <GoogleIcon />
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </button>
          </div>
        </div>
        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            className="font-semibold text-emerald-700 hover:text-emerald-800"
            href="/register"
          >
            Create one
          </Link>
        </p>
      </form>
    </section>
  );
}
