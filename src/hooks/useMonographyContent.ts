
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface MonographyContent {
  institution: string;
  campus: string;
  authors: string;
  title: string;
  subtitle?: string;
  location: string;
  year: string;
  workNature: string;
  advisor: string;
  coAdvisor?: string;
  abstract: string;
  keywords: string;
  introduction: string;
  development: string;
  conclusion: string;
  references: string;
  approvalDate?: string;
}

export const useMonographyContent = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const initialMonographyContent: MonographyContent = {
    institution: '',
    campus: '',
    authors: '',
    title: '',
    subtitle: '',
    location: '',
    year: '',
    workNature: '',
    advisor: '',
    coAdvisor: '',
    abstract: '',
    keywords: '',
    introduction: '',
    development: '',
    conclusion: '',
    references: '',
    approvalDate: '',
  };

  const [content, setContent] = useState<MonographyContent>(initialMonographyContent);

  const handleChange = (field: keyof MonographyContent, value: string) => {
    setContent(prev => ({
      ...prev,
      [field]: value
    }));

    if (user && id) {
      const saveContent = async () => {
        try {
          const { error } = await supabase
            .from('work_in_progress')
            .update({ 
              content: { ...content, [field]: value },
              last_modified: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
        } catch (error) {
          console.error('Error saving monography content:', error);
          toast({
            title: "Erro ao salvar",
            description: "Não foi possível salvar as alterações. Tente novamente.",
            variant: "destructive",
          });
        }
      };

      saveContent();
    }
  };

  useEffect(() => {
    if (user && id) {
      const loadContent = async () => {
        try {
          const { data, error } = await supabase
            .from('work_in_progress')
            .select('content')
            .eq('id', id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) throw error;
          if (data?.content) {
            setContent(data.content as MonographyContent);
          }
        } catch (error) {
          console.error('Error loading monography content:', error);
          toast({
            title: "Erro ao carregar",
            description: "Não foi possível carregar o conteúdo da monografia. Tente novamente.",
            variant: "destructive",
          });
        }
      };

      loadContent();
    }
  }, [id, user]);

  return {
    content,
    handleChange,
  };
};
