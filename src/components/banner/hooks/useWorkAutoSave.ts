
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>('');
  
  // Function to generate a unique title if none is provided
  const generateUniqueTitle = () => {
    const timestamp = new Date().toLocaleString('pt-BR');
    const randomId = Math.floor(Math.random() * 10000);
    return `Trabalho Desconhecido #${randomId} (${timestamp})`;
  };

  useEffect(() => {
    // Don't proceed if essential data is missing or still loading
    if (!currentWorkId || !user || isLoading) return;
    
    // Convert content to JSON string for comparison
    const currentContentString = JSON.stringify({...content, ...bannerContent});
    
    // Don't save if content hasn't changed
    if (currentContentString === lastContentRef.current) return;
    
    // Update the reference to current content
    lastContentRef.current = currentContentString;
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    const saveWork = async () => {
      try {
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
        
        // Update last saved timestamp
        setLastSaved(new Date());
        
        // Show a toast every 5 minutes
        const now = new Date();
        if (!lastSaved || now.getTime() - lastSaved.getTime() > 5 * 60 * 1000) {
          toast({
            title: "Trabalho salvo automaticamente",
            description: "Seu trabalho foi salvo com sucesso.",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Error saving work:', error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar seu trabalho automaticamente. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    };

    // Set a shorter timeout for autosave (every 30 seconds)
    saveTimeoutRef.current = setTimeout(saveWork, 500);
    
    // Cleanup function
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, bannerContent, user, currentWorkId, isLoading, lastSaved, toast]);

  // Also save when the user is about to leave the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentWorkId && user && !isLoading) {
        // Save synchronously before unload
        const workTitle = content.title?.replace(/<[^>]*>/g, '').trim() || generateUniqueTitle();
        
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
        
        // Using fetch API directly for synchronous saving before page unload
        const savePromise = fetch(`${supabase.supabaseUrl}/rest/v1/work_in_progress?id=eq.${currentWorkId}&user_id=eq.${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabase.supabaseKey,
            'Authorization': `Bearer ${supabase.supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            title: workTitle,
            content: completeContent,
            last_modified: new Date().toISOString(),
          }),
        });
        
        // This makes the browser wait for the save to complete
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [content, bannerContent, currentWorkId, user, isLoading]);

  return { lastSaved };
};
