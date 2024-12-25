import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const handleGoogleSignIn = async () => {
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
};

export const handleSignOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
    
    // Clear local storage
    localStorage.removeItem('supabase.auth.token');
    
    // Force reload the page to clear all states
    window.location.href = '/';
    
    toast.success('Logout realizado com sucesso!');
  } catch (error) {
    toast.error('Erro ao fazer logout');
    console.error('Error signing out:', error);
    throw error;
  }
};

export const cleanupHashFromUrl = () => {
  if (window.location.hash) {
    const cleanUrl = window.location.href.split('#')[0];
    window.history.replaceState({}, document.title, cleanUrl);
  }
};