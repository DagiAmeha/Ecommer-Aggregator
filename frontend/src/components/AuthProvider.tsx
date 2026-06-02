"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { User } from "firebase/auth";
import { subscribeToAuthChanges } from "@/services/auth.service";
import { fetchMyProfile, type UserProfile } from "@/services/user.service";

export type UserRole = "admin" | "vendor" | "user";

type AuthContextValue = {
  /** Firebase user, or null when signed out. */
  user: User | null;
  /** Normalized role string, or null until resolved / when signed out. */
  role: UserRole | null;
  /** Full backend profile, or null when unavailable. */
  profile: UserProfile | null;
  /**
   * True until BOTH the Firebase auth state has resolved AND (when a user is
   * present) the backend profile/role fetch has settled. Guards and headers
   * read this single signal instead of racing their own fetches.
   */
  loading: boolean;
};

const DEFAULT_VALUE: AuthContextValue = {
  user: null,
  role: null,
  profile: null,
  loading: true,
};

const AuthContext = createContext<AuthContextValue>(DEFAULT_VALUE);

/** Normalize the backend role (which may be a string or `{ value }`) to a plain string. */
function normalizeRole(role: UserProfile["role"]): UserRole | null {
  const value =
    typeof role === "string"
      ? role
      : role && typeof role === "object" && "value" in role
        ? role.value
        : null;

  if (value === "admin" || value === "vendor" || value === "user") {
    return value;
  }

  return value ? "user" : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  // Track auth + profile resolution separately, then collapse into one `loading`.
  const [authResolved, setAuthResolved] = useState(false);
  const [profileResolved, setProfileResolved] = useState(false);

  // Single Firebase subscription for the whole app.
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((nextUser) => {
      setUser(nextUser);
      setAuthResolved(true);
    });

    return unsubscribe;
  }, []);

  // Resolve the backend profile/role once per signed-in user.
  useEffect(() => {
    let active = true;

    if (!user) {
      setProfile(null);
      setRole(null);
      setProfileResolved(true);
      return;
    }

    setProfileResolved(false);

    fetchMyProfile()
      .then((nextProfile) => {
        if (!active) return;
        setProfile(nextProfile);
        setRole(normalizeRole(nextProfile.role));
      })
      .catch(() => {
        if (!active) return;
        setProfile(null);
        setRole(null);
      })
      .finally(() => {
        if (active) setProfileResolved(true);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      profile,
      loading: !authResolved || !profileResolved,
    }),
    [user, role, profile, authResolved, profileResolved],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}
