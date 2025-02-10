
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
  const loadingRef = useRef(false);

  useEffect(() => {
    const loadWork = async () => {
      if (!id || !user || loadingRef.current || currentWorkId === id) {
        setIsLoading(false);
        return;
      }

      try {
        loadingRef.current = true;
        setIsLoading(true);
        console.log(`Loading work ${id}`);

        const { data, error } = await supabase
          .from('work_in_progress')
          .select('content')
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

        if (data?.content) {
          setBannerContent(data.content);
          setCurrentWorkId(id);
          localStorage.removeItem(`banner_work_${user.id}_draft`);
        }
      } catch (error: any) {
        console.error('Error loading work:', error);
        toast({
          title: "Erro ao carregar trabalho",
          description: "Ocorreu um erro ao carregar o trabalho. Por favor, tente novamente mais tarde.",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    };

    loadWork();
  }, [id, user]);

  return {
    isLoading,
    currentWorkId,
  };
};
