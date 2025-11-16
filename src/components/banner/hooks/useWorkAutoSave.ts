
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface UseWorkAutoSaveProps {
  currentWorkId: string | null;
  user: User | null;
  content: any;
  bannerContent: any;
  isLoading: boolean;
}

export const useWorkAutoSave = ({
  currentWorkId,
  user,
  content,
  bannerContent,
  isLoading
}: UseWorkAutoSaveProps) => {
  useEffect(() => {
    if (!currentWorkId || !user || isLoading) return;

    const generateUniqueTitle = () => {
      const timestamp = new Date().toLocaleString('pt-BR');
      const randomId = Math.floor(Math.random() * 10000);
      return `Trabalho Desconhecido #${randomId} (${timestamp})`;
    };

    const saveWork = async () => {
      const workTitle = content.title?.replace(/<[^>]*>/g, '').trim() || generateUniqueTitle();
      
      // Ensure we're saving the complete content object
      const completeContent = {
        ...bannerContent,
        title: content.title || '',
        authors: content.authors || '',
        institution: content.institution || '',
        institutionLogo: content.institutionLogo || '',
        introduction: content.introduction || '',
        objectives: content.objectives || '',
        methodology: content.methodology || '',
        results: content.results || '',
        conclusion: content.conclusion || '',
        references: content.references || '',
        acknowledgments: content.acknowledgments || '',
        advisors: content.advisors || '',
      };
      
      try {
        const { error } = await supabase
          .from('work_in_progress')
          .update({
            title: workTitle,
            content: completeContent,
            last_modified: new Date().toISOString(),
          })
          .eq('id', currentWorkId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error saving work:', error);
          throw error;
        }
      } catch (error) {
        console.error('Error saving work:', error);
      }
    };

    const debounceTimeout = setTimeout(saveWork, 1000);
    return () => clearTimeout(debounceTimeout);
  }, [content, bannerContent, user, currentWorkId, isLoading]);

};
