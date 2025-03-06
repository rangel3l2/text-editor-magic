
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
  const hasLoaded = useRef(false);
  const isLoadingRef = useRef(true);

  useEffect(() => {
    const loadWork = async () => {
      if (!id || !user || hasLoaded.current || currentWorkId === id) {
        setIsLoading(false);
        isLoadingRef.current = false;
        return;
      }

      try {
        setIsLoading(true);
        isLoadingRef.current = true;
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
          console.log("Loaded content:", data.content);
          
          // Validate and ensure each field has its own content
          const savedContent = data.content;
          
          // Create a clean object with default values that won't be affected by any copying issues
          const completeContent = {
            title: typeof savedContent.title === 'string' ? savedContent.title : '',
            authors: typeof savedContent.authors === 'string' ? savedContent.authors : '',
            institution: typeof savedContent.institution === 'string' ? savedContent.institution : '',
            institutionLogo: typeof savedContent.institutionLogo === 'string' ? savedContent.institutionLogo : '',
            introduction: typeof savedContent.introduction === 'string' ? savedContent.introduction : '',
            objectives: typeof savedContent.objectives === 'string' ? savedContent.objectives : '',
            methodology: typeof savedContent.methodology === 'string' ? savedContent.methodology : '',
            results: typeof savedContent.results === 'string' ? savedContent.results : '',
            conclusion: typeof savedContent.conclusion === 'string' ? savedContent.conclusion : '',
            references: typeof savedContent.references === 'string' ? savedContent.references : '',
            acknowledgments: typeof savedContent.acknowledgments === 'string' ? savedContent.acknowledgments : '',
            previewHtml: typeof savedContent.previewHtml === 'string' ? savedContent.previewHtml : '',
            advisors: typeof savedContent.advisors === 'string' ? savedContent.advisors : '',
          };
          
          setBannerContent(completeContent);
          setCurrentWorkId(id);
          hasLoaded.current = true;
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
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadWork();

    return () => {
      hasLoaded.current = false;
    };
  }, [id, user]);

  return {
    isLoading,
    currentWorkId,
  };
};
