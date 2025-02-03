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
  const loadingRef = useRef(false);

  const loadWork = async (workId: string, userId: string) => {
    if (loadingRef.current || !isMountedRef.current || hasLoadedRef.current) {
      return;
    }

    loadingRef.current = true;
    loadAttemptRef.current += 1;

    try {
      console.log(`Loading work ${workId} (attempt ${loadAttemptRef.current})`);
      
      if (loadAttemptRef.current > maxLoadAttempts) {
        throw new Error('Max attempts reached');
      }

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

      if (isMountedRef.current && !hasLoadedRef.current) {
        console.log('Work data loaded:', data);
        if (data?.content) {
          setBannerContent(data.content);
          hasLoadedRef.current = true;
          localStorage.removeItem(`banner_work_${userId}_draft`);
        }
      }
    } catch (error: any) {
      console.error('Error loading work:', error);
      
      // Check if it's a resource error or max attempts reached
      if (error.message?.includes('ERR_INSUFFICIENT_RESOURCES') || 
          error.message === 'Max attempts reached') {
        if (isMountedRef.current) {
          toast({
            title: "Erro ao carregar trabalho",
            description: "Ocorreu um erro ao carregar o trabalho. Por favor, tente novamente mais tarde.",
            variant: "destructive",
          });
          navigate('/');
        }
        return;
      }

      // For other errors, retry with exponential backoff if attempts remain
      if (isMountedRef.current && loadAttemptRef.current < maxLoadAttempts) {
        const retryDelay = Math.min(1000 * Math.pow(2, loadAttemptRef.current - 1), 5000);
        setTimeout(() => {
          loadingRef.current = false;
          if (isMountedRef.current && !hasLoadedRef.current) {
            loadWork(workId, userId);
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
  };

  const debouncedLoadWork = useRef(
    debounce((workId: string, userId: string) => loadWork(workId, userId), 1000, {
      leading: true,
      trailing: false
    })
  ).current;

  useEffect(() => {
    // Reset state when id changes
    hasLoadedRef.current = false;
    loadAttemptRef.current = 0;
    loadingRef.current = false;
    
    if (id && user && !hasLoadedRef.current) {
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