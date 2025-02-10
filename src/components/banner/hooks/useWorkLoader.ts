
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
  const isMountedRef = useRef(true);

  const loadWork = async (workId: string, userId: string) => {
    // Se já carregou ou componente foi desmontado, não prosseguir
    if (hasLoadedRef.current || !isMountedRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Loading work ${workId}`);

      // Validar IDs antes de fazer a requisição
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

      if (isMountedRef.current) {
        console.log('Work data loaded:', data);
        if (data?.content) {
          setBannerContent(data.content);
          hasLoadedRef.current = true;
          localStorage.removeItem(`banner_work_${userId}_draft`);
        }
      }
    } catch (error: any) {
      console.error('Error loading work:', error);
      
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
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    hasLoadedRef.current = false;
    
    if (id && user) {
      setCurrentWorkId(id);
      loadWork(id, user.id);
    } else {
      setIsLoading(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [id, user]);

  return {
    isLoading,
    currentWorkId,
  };
};
