import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        // Remove hash from URL if present
        if (window.location.hash) {
          const cleanUrl = window.location.href.split('#')[0];
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Remove hash from URL if present
        if (window.location.hash) {
          const cleanUrl = window.location.href.split('#')[0];
          window.history.replaceState({}, document.title, cleanUrl);
        }
        toast.success('Login realizado com sucesso!');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        if (error.message.includes('provider is not enabled')) {
          toast.error('O login com Google não está habilitado. Por favor, contate o administrador do sistema.');
        } else {
          toast.error('Erro ao fazer login com Google');
        }
        console.error('Error signing in:', error);
      }
    } catch (error) {
      toast.error('Erro ao fazer login com Google');
      console.error('Error signing in:', error);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('Erro ao fazer logout');
        console.error('Error signing out:', error);
      } else {
        toast.success('Logout realizado com sucesso!');
        navigate('/');
      }
    } catch (error) {
      toast.error('Erro ao fazer logout');
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};