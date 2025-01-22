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
  const [hasShownFirstLoadError, setHasShownFirstLoadError] = useState(false);
  const [currentWorkId, setCurrentWorkId] = useState<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadAttemptRef = useRef(0);
  const maxLoadAttempts = 3;
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const loadWork = async () => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        if (!id) {
          if (user) {
            const localStorageKey = `banner_work_${user.id}_draft`;
            const savedDraft = localStorage.getItem(localStorageKey);
            if (savedDraft) {
              const parsedDraft = JSON.parse(savedDraft);
              setBannerContent(parsedDraft.content);
            }
          }
          setIsLoading(false);
          return;
        }

        setCurrentWorkId(id);

        if (!user) {
          navigate('/');
          return;
        }

        console.log('Fetching work with ID:', id);
        const { data, error } = await supabase
          .from('work_in_progress')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching work:', error);
          if (error.message?.includes('JWT')) {
            toast({
              title: "Sessão expirada",
              description: "Por favor, faça login novamente.",
              variant: "destructive",
            });
            return;
          }
          
          if (loadAttemptRef.current < maxLoadAttempts) {
            loadAttemptRef.current += 1;
            setTimeout(loadWork, 2000 * loadAttemptRef.current);
            return;
          }

          toast({
            title: "Erro de conexão",
            description: "Não foi possível conectar ao servidor. Por favor, verifique sua conexão e tente novamente.",
            variant: "destructive",
          });
          return;
        }

        if (!data) {
          console.log('No data found for work ID:', id);
          if (loadAttemptRef.current < maxLoadAttempts) {
            loadAttemptRef.current += 1;
            setTimeout(loadWork, 2000 * loadAttemptRef.current);
            return;
          }
          
          toast({
            title: "Trabalho não encontrado",
            description: "O trabalho que você selecionou não foi encontrado ou você não tem permissão para acessá-lo.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }
        
        console.log('Work data loaded:', data);
        if (data?.content) {
          setBannerContent(data.content);
          localStorage.removeItem(`banner_work_${user.id}_draft`);
          loadAttemptRef.current = 0;
        }
      } catch (error: any) {
        console.error('Error loading work:', error);
        if (loadAttemptRef.current < maxLoadAttempts) {
          loadAttemptRef.current += 1;
          setTimeout(loadWork, 2000 * loadAttemptRef.current);
          return;
        }
        
        if (!hasShownFirstLoadError) {
          toast({
            title: "Erro ao carregar trabalho",
            description: "Ocorreu um erro ao tentar carregar o trabalho selecionado. Por favor, tente novamente.",
            variant: "destructive",
          });
          setHasShownFirstLoadError(true);
        }
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    };

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    loadWork();

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, user, setBannerContent, navigate, toast, hasShownFirstLoadError]);

  return {
    isLoading,
    currentWorkId,
  };
};