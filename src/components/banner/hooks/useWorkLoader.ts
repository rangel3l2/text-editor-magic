
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
  const mounted = useRef(true);
  const loadedWorkId = useRef<string | null>(null);
  const loadingRef = useRef(false);

  const loadWork = async (workId: string, userId: string) => {
    // Skip if already loaded this work, unmounted, or currently loading
    if (!mounted.current || loadedWorkId.current === workId || loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      console.log(`Loading work ${workId}`);

      if (!workId || !userId) {
        throw new Error('IDs inválidos');
      }

      const { data, error } = await supabase
        .from('work_in_progress')
        .select('*')
        .eq('id', workId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data) {
        if (mounted.current) {
          toast({
            title: "Trabalho não encontrado",
            description: "O trabalho que você selecionou não foi encontrado ou você não tem permissão para acessá-lo.",
            variant: "destructive",
          });
          navigate('/');
        }
        return;
      }

      if (mounted.current) {
        console.log('Work data loaded:', data);
        if (data?.content) {
          setBannerContent(data.content);
          loadedWorkId.current = workId;
          localStorage.removeItem(`banner_work_${userId}_draft`);
        }
      }
    } catch (error: any) {
      console.error('Error loading work:', error);
      
      if (mounted.current) {
        toast({
          title: "Erro ao carregar trabalho",
          description: "Ocorreu um erro ao carregar o trabalho. Por favor, tente novamente mais tarde.",
          variant: "destructive",
        });
        navigate('/');
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    mounted.current = true;
    loadedWorkId.current = null;
    loadingRef.current = false;
    
    const initLoad = async () => {
      if (id && user) {
        setCurrentWorkId(id);
        await loadWork(id, user.id);
      } else {
        setIsLoading(false);
      }
    };

    initLoad();

    return () => {
      mounted.current = false;
      loadingRef.current = false;
    };
  }, [id, user]);

  return {
    isLoading,
    currentWorkId,
  };
};
