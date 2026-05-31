"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/services/firebase";
import { apiRequest } from "@/services/api";

interface UserProfile {
  id: number;
  email: string;
  full_name: string | null;
  role: { value: string };
}

/**
 * AdminGuard component ensures only users with 'admin' role can access admin routes.
 * Redirects non-admin users to the home page.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
        return;
      }

      try {
        const profile = await apiRequest<UserProfile>("/users/profile");
        const role =
          typeof profile.role === "string"
            ? profile.role
            : profile.role?.value;

        if (role === "admin") {
          setAuthorized(true);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to verify admin access:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
