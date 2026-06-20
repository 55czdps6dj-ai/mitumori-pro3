'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export const useAuthGate = () => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        window.location.href = '/login';
        return;
      }

      setIsCheckingAuth(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        window.location.href = '/login';
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isCheckingAuth };
};
