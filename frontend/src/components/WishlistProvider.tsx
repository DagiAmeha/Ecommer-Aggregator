"use client";

import type { Dispatch, SetStateAction } from "react";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchWishlistCount } from "@/services/wishlist.service";

type WishlistContextValue = {
  count: number;
  setCount: Dispatch<SetStateAction<number>>;
  refreshCount: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refreshCount = useCallback(async (): Promise<void> => {
    if (!user) {
      setCount((prev) => (prev === 0 ? prev : 0));
      return;
    }

    try {
      const response = await fetchWishlistCount();
      setCount(response.count ?? 0);
    } catch {
      setCount((prev) => (prev === 0 ? prev : 0));
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCount();
  }, [refreshCount]);

  const value = useMemo(
    () => ({
      count,
      setCount,
      refreshCount,
    }),
    [count, refreshCount],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }

  return context;
}
