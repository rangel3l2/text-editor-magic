import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import debounce from 'lodash/debounce';

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
  const loadingRef = useRef(false);

  // Create a debounced version of the load function
  const debouncedLoadWork = useRef(
    debounce(async (workId: string, userId: string) => {
      if (loadingRef.current || !isMountedRef.current || successfulLoadRef.current) {
        return;
      }

      loadingRef.current = true;
      try {
        console.log(`Loading work ${workId}`);
        const { data, error } = await supabase
          .from('work_in_progress')
          .select('*')
          .eq('id', workId)
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          if (isMountedRef.current) {
            toast({
              title: "Trabalho não encontrado",
              description: "O trabalho que você selecionou não foi encontrado ou você não tem permissão para acessá-lo.",
              variant: "destructive",
            });
            navigate('/');
          }
          return;
        }

        if (isMountedRef.current && !successfulLoadRef.current) {
          console.log('Work data loaded:', data);
          if (data?.content) {
            setBannerContent(data.content);
            hasLoadedRef.current = true;
            successfulLoadRef.current = true;
            localStorage.removeItem(`banner_work_${userId}_draft`);
          }
        }
      } catch (error: any) {
        console.error('Error loading work:', error);
        if (isMountedRef.current && loadAttemptRef.current < maxLoadAttempts) {
          loadAttemptRef.current += 1;
          const retryDelay = Math.min(1000 * Math.pow(2, loadAttemptRef.current - 1), 5000);
          setTimeout(() => {
            loadingRef.current = false;
            if (isMountedRef.current) {
              debouncedLoadWork.current(workId, userId);
            }
          }, retryDelay);
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
          loadingRef.current = false;
        }
      }
    }, 1000)
  ).current;

  useEffect(() => {
    // Reset refs when id changes
    hasLoadedRef.current = false;
    loadAttemptRef.current = 0;
    successfulLoadRef.current = false;
    loadingRef.current = false;
    
    if (id && user && !successfulLoadRef.current) {
      setCurrentWorkId(id);
      debouncedLoadWork(id, user.id);
    } else {
      setIsLoading(false);
    }

    return () => {
      isMountedRef.current = false;
      debouncedLoadWork.cancel();
    };
  }, [id, user, debouncedLoadWork]);

  return {
    isLoading,
    currentWorkId,
  };
};