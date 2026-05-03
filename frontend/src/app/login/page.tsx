"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/services/firebase";

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
    default:
      return error instanceof Error && error.message ? error.message : fallback;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
      router.push("/products");
    } catch (err) {
      setError(getAuthMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-md gap-6 rounded-[32px] border border-black/10 bg-white/80 p-8 shadow-[0_16px_50px_rgba(16,35,30,0.08)]">
      <div>
        <p className="display-font text-3xl font-semibold text-slate-950">
          Welcome back
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Sign in with Firebase Authentication to browse live aggregated
          products.
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
          className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
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
