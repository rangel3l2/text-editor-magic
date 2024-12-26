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
      console.log("Initial session check:", session);
      if (session) {
        setUser(session.user);
        cleanupHashFromUrl();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      const previousUser = user;
      const currentUser = session?.user;
      
      setUser(currentUser);

      // Only show login success toast when actually logging in
      if (event === 'SIGNED_IN' && !previousUser && currentUser) {
        cleanupHashFromUrl();
        toast.success('Login realizado com sucesso!');
        
        // Verificar se o perfil existe e criar se necessário
        const checkAndCreateProfile = async () => {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

          console.log("Profile check result:", profile, profileError);

          if (!profile) {
            console.log("Creating new profile for user:", currentUser.email);
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([
                { 
                  id: currentUser.id,
                  email: currentUser.email,
                  is_admin: currentUser.email === 'rangel.silva@estudante.ifms.edu.br' || 
                           currentUser.email === 'rangel3lband@gmail.com'
                }
              ]);

            if (insertError) {
              console.error("Error creating profile:", insertError);
            } else {
              console.log("Profile created successfully");
            }
          }
        };

        checkAndCreateProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, [user]);

  return { user, setUser };
};