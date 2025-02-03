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
  const isMountedRef = useRef(true);
  const loadingRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadWork = async (workId: string, userId: string) => {
    // If already loading or component unmounted or already loaded successfully, don't proceed
    if (loadingRef.current || !isMountedRef.current || hasLoadedRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
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
      
      // Check if it's a resource error
      if (error.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
        if (isMountedRef.current) {
          toast({
            title: "Erro ao carregar trabalho",
            description: "Ocorreu um erro ao carregar o trabalho. Por favor, aguarde um momento e tente novamente.",
            variant: "destructive",
          });
        }
        // Add a delay before retrying
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && !hasLoadedRef.current) {
            loadingRef.current = false;
            loadWork(workId, userId);
          }
        }, 5000); // Wait 5 seconds before retrying
        return;
      }

      if (isMountedRef.current) {
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

  // Create a debounced version of loadWork that only executes the first call
  const debouncedLoadWork = useRef(
    debounce((workId: string, userId: string) => loadWork(workId, userId), 1000, {
      leading: true,
      trailing: false
    })
  ).current;

  useEffect(() => {
    isMountedRef.current = true;
    hasLoadedRef.current = false;
    loadingRef.current = false;
    
    if (id && user && !hasLoadedRef.current) {
      setCurrentWorkId(id);
      debouncedLoadWork(id, user.id);
    } else {
      setIsLoading(false);
    }

    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      debouncedLoadWork.cancel();
    };
  }, [id, user, debouncedLoadWork]);

  return {
    isLoading,
    currentWorkId,
  };
};