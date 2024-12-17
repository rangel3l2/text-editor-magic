import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cleanupHashFromUrl } from './authUtils';

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check current session without showing toast
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        cleanupHashFromUrl();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const previousUser = user;
      const currentUser = session?.user;
      
      setUser(currentUser);

      // Only show login success toast when actually logging in
      if (event === 'SIGNED_IN' && !previousUser && currentUser) {
        cleanupHashFromUrl();
        toast.success('Login realizado com sucesso!');
      }
    });

    return () => subscription.unsubscribe();
  }, [user]);

  return { user, setUser };
};