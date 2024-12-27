import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const handleGoogleSignIn = async () => {
  try {
    console.log("Iniciando processo de login com Google...");
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
      console.error('Erro no login com Google:', error);
      if (error.message.includes('provider is not enabled')) {
        toast.error('O login com Google não está habilitado. Por favor, contate o administrador do sistema.');
      } else {
        toast.error('Erro ao fazer login com Google. Por favor, tente novamente.');
      }
    }
  } catch (error) {
    console.error('Erro inesperado no login:', error);
    toast.error('Erro inesperado ao tentar fazer login. Por favor, tente novamente.');
  }
};

export const handleSignOut = async () => {
  try {
    console.log("Iniciando processo de logout...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout. Por favor, tente novamente.');
      throw error;
    }
    toast.success('Logout realizado com sucesso!');
  } catch (error) {
    console.error('Erro inesperado no logout:', error);
    toast.error('Erro inesperado ao tentar fazer logout. Por favor, tente novamente.');
  }
};

export const cleanupHashFromUrl = () => {
  if (window.location.hash) {
    const cleanUrl = window.location.href.split('#')[0];
    window.history.replaceState({}, document.title, cleanUrl);
  }
};