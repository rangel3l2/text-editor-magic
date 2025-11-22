
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useIsAdmin } from '@/hooks/useUserRole';

interface UseWorkLoaderProps {
  id: string | undefined;
  user: User | null;
  setBannerContent: (content: any) => void;
}

export const useWorkLoader = ({ id, user, setBannerContent }: UseWorkLoaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsAdmin(user);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWorkId, setCurrentWorkId] = useState<string | null>(null);
  const isFetching = useRef(false);
  const errorToastShown = useRef(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    const loadWork = async () => {
        // Wait for admin status to load before fetching work
        if (!id || !user || isFetching.current || currentWorkId === id || attemptsRef.current >= 3 || isLoadingAdmin) {
          setIsLoading(isLoadingAdmin);
          return;
        }

      try {
        setIsLoading(true);
        attemptsRef.current += 1;
        isFetching.current = true;
        console.log(`Loading work ${id}, isAdmin: ${isAdmin}`);

        // Build query - admins can view all works, regular users only their own
        let query = supabase
          .from('work_in_progress')
          .select('content')
          .eq('id', id);

        // Only filter by user_id if not admin
        if (!isAdmin) {
          query = query.eq('user_id', user.id);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        if (!data) {
          toast({
            title: "Trabalho não encontrado",
            description: "O trabalho selecionado não foi encontrado ou você não tem permissão.",
            variant: "destructive",
          });
          return;
        }

        if (data?.content) {
          // Type cast the JSONB content to any
          const savedContent = data.content as any;
          
          // Try to load logo from localStorage as fallback
          const localLogo = localStorage.getItem(`banner_logo_${id}`);
          const localLogoConfig = localStorage.getItem(`banner_logo_config_${id}`);
          
          // Ensure we have default values for all fields if they're missing
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
            title: "Erro ao carregar trabalho",
            description: "Falha temporária de rede. Tente novamente em instantes.",
            variant: "destructive",
          });
          errorToastShown.current = true;
        }
      } finally {
        setIsLoading(false);
        isFetching.current = false;
      }
    };

    loadWork();

    
  }, [id, user, isAdmin, isLoadingAdmin]);

  return {
    isLoading,
    currentWorkId,
  };
};
