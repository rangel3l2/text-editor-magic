import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cleanupHashFromUrl } from './authUtils';

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const previousUserRef = useRef<User | null>(null);

  useEffect(() => {
    // Check current session without showing toast
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        previousUserRef.current = session.user;
        cleanupHashFromUrl();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const previousUser = previousUserRef.current;
      const currentUser = session?.user ?? null;
      
      setUser(currentUser);
      previousUserRef.current = currentUser;

      // Only show login success toast when actually logging in
      if (event === 'SIGNED_IN' && !previousUser && currentUser) {
        cleanupHashFromUrl();
        toast.success('Login realizado com sucesso!');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, setUser };
};