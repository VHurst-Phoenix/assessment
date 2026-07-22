import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';

const supabaseStatus = getSupabaseClient();

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() => !supabaseStatus.error);
  const [error, setError] = useState(() => supabaseStatus.error || '');

  useEffect(() => {
    const { client, error: clientError } = supabaseStatus;

    if (clientError || !client) {
      return undefined;
    }

    let isMounted = true;

    const loadUser = async () => {
      setIsLoading(true);
      setError('');

      const { data, error: authError } = await client.auth.getUser();

      if (!isMounted) return;

      if (authError) {
        setUser(null);
        setError(authError.message || 'Unable to verify user access.');
      } else {
        setUser(data?.user || null);
      }

      setIsLoading(false);
    };

    loadUser();

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      if (typeof listener?.subscription?.unsubscribe === 'function') {
        listener.subscription.unsubscribe();
      }
    };
  }, []);

  return {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    error,
  };
}
