
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
          
          // Create a new clean object with default empty values
          const completeContent = {
            title: '',
            authors: '',
            institution: '',
            institutionLogo: '',
            introduction: '',
            objectives: '',
            methodology: '',
            results: '',
            conclusion: '',
            references: '',
            acknowledgments: '',
            previewHtml: '',
            advisors: '',
          };
          
          // Only copy values that exist in the saved content, field by field
          const savedContent = data.content;
          
          // Only set fields that exist in the saved content
          if (typeof savedContent.title === 'string') completeContent.title = savedContent.title;
          if (typeof savedContent.authors === 'string') completeContent.authors = savedContent.authors;
          if (typeof savedContent.institution === 'string') completeContent.institution = savedContent.institution;
          if (typeof savedContent.institutionLogo === 'string') completeContent.institutionLogo = savedContent.institutionLogo;
          if (typeof savedContent.introduction === 'string') completeContent.introduction = savedContent.introduction;
          if (typeof savedContent.objectives === 'string') completeContent.objectives = savedContent.objectives;
          if (typeof savedContent.methodology === 'string') completeContent.methodology = savedContent.methodology;
          if (typeof savedContent.results === 'string') completeContent.results = savedContent.results;
          if (typeof savedContent.conclusion === 'string') completeContent.conclusion = savedContent.conclusion;
          if (typeof savedContent.references === 'string') completeContent.references = savedContent.references;
          if (typeof savedContent.acknowledgments === 'string') completeContent.acknowledgments = savedContent.acknowledgments;
          if (typeof savedContent.previewHtml === 'string') completeContent.previewHtml = savedContent.previewHtml;
          if (typeof savedContent.advisors === 'string') completeContent.advisors = savedContent.advisors;
          
          // Set banner content with the properly structured content
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
