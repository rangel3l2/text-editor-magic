import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  supabase: SupabaseClient;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient(
    'https://xevbmqbwdaqdfexhmbmu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldmJtcWJ3ZGFxZGZleGhtYm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzODk0MTMsImV4cCI6MjA0Nzk2NTQxM30.rB31otfyrrahIGI7lmBcEH4QPENqbX59q0Flpm6E_mY'
  );

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        toast.success('Bem-vindo de volta!');
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
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
          redirectTo: window.location.href.split('#')[0]
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
      }
    } catch (error) {
      toast.error('Erro ao fazer logout');
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, supabase, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};