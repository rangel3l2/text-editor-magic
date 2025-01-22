import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface UseWorkCreatorProps {
  user: User | null;
  content: any;
  bannerContent: any;
  currentWorkId: string | null;
}

export const useWorkCreator = ({ user, content, bannerContent, currentWorkId }: UseWorkCreatorProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shouldCreateWork, setShouldCreateWork] = useState(false);
  const workCreatedRef = useRef(false);
  const createWorkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFieldValueRef = useRef<string>("");

  const generateUniqueTitle = () => {
    const timestamp = new Date().toLocaleString('pt-BR');
    const randomId = Math.floor(Math.random() * 10000);
    return `Trabalho Desconhecido #${randomId} (${timestamp})`;
  };

  useEffect(() => {
    if (shouldCreateWork && user && !currentWorkId && !workCreatedRef.current) {
      const createWork = async () => {
        try {
          workCreatedRef.current = true;
          const workTitle = content.title?.replace(/<[^>]*>/g, '').trim() || generateUniqueTitle();
          
          const { data, error } = await supabase
            .from('work_in_progress')
            .insert([
              {
                user_id: user.id,
                title: workTitle,
                work_type: 'banner',
                content: bannerContent,
              }
            ])
            .select()
            .maybeSingle();

          if (error) {
            console.error('Error creating work:', error);
            throw error;
          }
          
          if (data) {
            localStorage.removeItem(`banner_work_${user.id}_draft`);
            navigate(`/banner/${data.id}`);
          }
        } catch (error: any) {
          console.error('Error creating work:', error);
          workCreatedRef.current = false;
          toast({
            title: "Erro ao criar trabalho",
            description: "Ocorreu um erro ao criar seu trabalho. Por favor, tente novamente.",
            variant: "destructive",
          });
        } finally {
          setShouldCreateWork(false);
        }
      };

      createWork();
    }
  }, [shouldCreateWork, user, currentWorkId, content.title, bannerContent, toast, navigate]);

  return {
    setShouldCreateWork,
    createWorkTimeoutRef,
    lastFieldValueRef,
  };
};