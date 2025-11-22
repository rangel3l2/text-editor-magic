
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
  const isFetching = useRef(false);
  const errorToastShown = useRef(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    const loadWork = async () => {
      if (!id || !user || isFetching.current || currentWorkId === id || attemptsRef.current >= 3) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        attemptsRef.current += 1;
        isFetching.current = true;
        console.log(`Loading work ${id}`);

        // Rely on database RLS policies to control access
        const { data, error } = await supabase
          .from('work_in_progress')
          .select('content')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error('Error loading work from database:', error);
          throw error;
        }

        if (!data) {
          toast({
            title: 'Trabalho não encontrado',
            description: 'O trabalho selecionado não foi encontrado ou você não tem permissão.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        if (data.content) {
          const savedContent = data.content as any;

          const localLogo = localStorage.getItem(`banner_logo_${id}`);
          const localLogoConfig = localStorage.getItem(`banner_logo_config_${id}`);

          const completeContent = {
            title: savedContent.title || '',
            authors: savedContent.authors || '',
            institution: savedContent.institution || '',
            institutionLogo: savedContent.institutionLogo || localLogo || '',
            logoConfig: savedContent.logoConfig || (localLogoConfig ? JSON.parse(localLogoConfig) : undefined),
            introduction: savedContent.introduction || '',
            objectives: savedContent.objectives || '',
            methodology: savedContent.methodology || '',
            results: savedContent.results || '',
            conclusion: savedContent.conclusion || '',
            references: savedContent.references || '',
            acknowledgments: savedContent.acknowledgments || '',
            previewHtml: savedContent.previewHtml || '',
            advisors: savedContent.advisors || '',
          };

          setBannerContent(completeContent);
          setCurrentWorkId(id);
        }
      } catch (error: any) {
        console.error('Error loading work:', error);
        if (!errorToastShown.current) {
          toast({
            title: 'Erro ao carregar trabalho',
            description: 'Falha temporária de rede. Tente novamente em instantes.',
            variant: 'destructive',
          });
          errorToastShown.current = true;
        }
      } finally {
        setIsLoading(false);
        isFetching.current = false;
      }
    };

    loadWork();
  }, [id, user, currentWorkId, navigate, toast, setBannerContent]);

  return {
    isLoading,
    currentWorkId,
  };
};
