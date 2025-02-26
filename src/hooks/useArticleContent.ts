
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface ArticleContent {
  title: string;
  subtitle?: string;
  authors: string;
  institution: string;
  advisors: string;
  abstract: string;
  keywords: string;
  englishAbstract: string;
  englishKeywords: string;
  introduction: string;
  theoreticalFramework: string;
  methodology: string;
  results: string;
  discussion: string;
  development: string;
  conclusion: string;
  references: string;
  appendices?: string;
  attachments?: string;
  approvalDate?: string;
}

export const useArticleContent = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const initialArticleContent: ArticleContent = {
    title: '',
    subtitle: '',
    authors: '',
    institution: '',
    advisors: '',
    abstract: '',
    keywords: '',
    englishAbstract: '',
    englishKeywords: '',
    introduction: '',
    theoreticalFramework: '',
    methodology: '',
    results: '',
    discussion: '',
    development: '',
    conclusion: '',
    references: '',
    appendices: '',
    attachments: '',
    approvalDate: '',
  };

  const [content, setContent] = useState<ArticleContent>(initialArticleContent);

  const handleChange = (field: keyof ArticleContent, value: string) => {
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
          console.error('Error saving article content:', error);
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
            setContent(data.content as ArticleContent);
          }
        } catch (error) {
          console.error('Error loading article content:', error);
          toast({
            title: "Erro ao carregar",
            description: "Não foi possível carregar o conteúdo do artigo. Tente novamente.",
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
