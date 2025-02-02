import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface UseWorkLoaderProps {
  id: string | undefined;
  user: User | null;
  setBannerContent: (content: any) => void;
}

export const useWorkLoader = ({ id, user, setBannerContent }: UseWorkLoaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [currentWorkId, setCurrentWorkId] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const loadAttemptRef = useRef(0);
  const maxLoadAttempts = 3;
  const isMountedRef = useRef(true);
  const successfulLoadRef = useRef(false);

  useEffect(() => {
    // Reset refs when id changes
    hasLoadedRef.current = false;
    loadAttemptRef.current = 0;
    successfulLoadRef.current = false;
    
    const loadWork = async () => {
      // Don't load if already loaded successfully or missing requirements
      if (!id || !user || hasLoadedRef.current || successfulLoadRef.current || !isMountedRef.current) {
        setIsLoading(false);
        return;
      }

      try {
        loadAttemptRef.current += 1;
        console.log(`Attempt ${loadAttemptRef.current} to load work ${id}`);

        if (loadAttemptRef.current > maxLoadAttempts) {
          toast({
            title: "Erro ao carregar trabalho",
            description: "Número máximo de tentativas excedido. Por favor, tente novamente mais tarde.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setCurrentWorkId(id);
        const { data, error } = await supabase
          .from('work_in_progress')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          toast({
            title: "Trabalho não encontrado",
            description: "O trabalho que você selecionou não foi encontrado ou você não tem permissão para acessá-lo.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        if (isMountedRef.current) {
          console.log('Work data loaded:', data);
          if (data?.content) {
            setBannerContent(data.content);
            hasLoadedRef.current = true;
            successfulLoadRef.current = true;
            localStorage.removeItem(`banner_work_${user.id}_draft`);
          }
        }
      } catch (error: any) {
        console.error('Error loading work:', error);
        if (isMountedRef.current && loadAttemptRef.current < maxLoadAttempts) {
          const retryDelay = Math.min(1000 * Math.pow(2, loadAttemptRef.current - 1), 5000);
          setTimeout(loadWork, retryDelay);
        } else if (isMountedRef.current) {
          toast({
            title: "Erro ao carregar trabalho",
            description: "Ocorreu um erro ao carregar o trabalho. Por favor, tente novamente mais tarde.",
            variant: "destructive",
          });
          navigate('/');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadWork();

    return () => {
      isMountedRef.current = false;
    };
  }, [id, user, setBannerContent, navigate, toast]);

  return {
    isLoading,
    currentWorkId,
  };
};