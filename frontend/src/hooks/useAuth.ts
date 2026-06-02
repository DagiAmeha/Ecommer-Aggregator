import { useAuthContext } from "@/components/AuthProvider";

/**
 * Backwards-compatible auth hook. Reads from the shared {@link AuthProvider}
 * context so the whole app uses ONE Firebase subscription and ONE resolved
 * role, instead of every component spinning up its own subscription + a
 * duplicate `/users/me` fetch (which is what made role state look "dropped"
 * during client-side navigation).
 */
export function useAuth() {
  const { user, loading, role, profile } = useAuthContext();
  return { user, loading, role, profile };
}
