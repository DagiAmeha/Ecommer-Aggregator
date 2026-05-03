import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { getCurrentUser, subscribeToAuthChanges } from '../services/auth.service';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
