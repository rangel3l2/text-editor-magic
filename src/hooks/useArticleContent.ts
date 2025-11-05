import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface TheoreticalTopic {
  id: string;
  title: string;
  content: string;
  order: number;
}

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
  theoreticalTopics: TheoreticalTopic[];
  methodology: string;
  results: string; // Agora inclui Resultados e Discussão unificados (padrão IFMS)
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
    theoreticalTopics: [],
    methodology: '',
    results: '', // Resultados e Discussão unificados
    conclusion: '',
    references: '',
    appendices: '',
    attachments: '',
    approvalDate: '',
  };

  const [content, setContent] = useState<ArticleContent>(initialArticleContent);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: keyof ArticleContent, value: string | TheoreticalTopic[]) => {
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
              content: { ...content, [field]: value } as any,
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

  const addTheoreticalTopic = () => {
    const newTopic: TheoreticalTopic = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      order: content.theoreticalTopics.length + 2, // +2 porque a introdução é 1
    };

    const updatedTopics = [...content.theoreticalTopics, newTopic];
    handleChange('theoreticalTopics', updatedTopics);
  };

  const updateTheoreticalTopic = (topicId: string, field: 'title' | 'content', value: string) => {
    const updatedTopics = content.theoreticalTopics.map(topic => {
      if (topic.id === topicId) {
        return { ...topic, [field]: value };
      }
      return topic;
    });
    handleChange('theoreticalTopics', updatedTopics);
  };

  const removeTheoreticalTopic = (topicId: string) => {
    const updatedTopics = content.theoreticalTopics
      .filter(topic => topic.id !== topicId)
      .map((topic, index) => ({
        ...topic,
        order: index + 2 // Reordenar após remover
      }));
    handleChange('theoreticalTopics', updatedTopics);
  };

  const reorderTheoreticalTopics = (topicId: string, newOrder: number) => {
    const topic = content.theoreticalTopics.find(t => t.id === topicId);
    if (!topic) return;

    const updatedTopics = content.theoreticalTopics
      .map(t => {
        if (t.id === topicId) {
          return { ...t, order: newOrder };
        }
        if (t.order >= newOrder && t.id !== topicId) {
          return { ...t, order: t.order + 1 };
        }
        return t;
      })
      .sort((a, b) => a.order - b.order);

    handleChange('theoreticalTopics', updatedTopics);
  };

  useEffect(() => {
    if (user && id) {
      const loadContent = async () => {
        setIsLoading(true);
        console.log(`[ArticleContent] Loading work ${id} for user ${user.id}`);
        
        try {
          const { data, error } = await supabase
            .from('work_in_progress')
            .select('content, title, work_type')
            .eq('id', id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) {
            console.error('[ArticleContent] Supabase error:', error);
            throw error;
          }
          
          if (!data) {
            console.error('[ArticleContent] Work not found:', id);
            toast({
              title: "Trabalho não encontrado",
              description: "O trabalho que você tentou abrir não foi encontrado ou você não tem permissão para acessá-lo.",
              variant: "destructive",
            });
            return;
          }

          console.log('[ArticleContent] Work loaded successfully:', data.title);
          
          if (data?.content) {
            const loadedContent = data.content as any as ArticleContent;
            console.log('[ArticleContent] Content sections:', {
              hasTitle: !!loadedContent.title,
              hasAbstract: !!loadedContent.abstract,
              hasIntroduction: !!loadedContent.introduction,
              hasMethodology: !!loadedContent.methodology,
              hasResults: !!loadedContent.results,
              hasConclusion: !!loadedContent.conclusion,
              hasReferences: !!loadedContent.references,
            });
            setContent(loadedContent);
          }
        } catch (error: any) {
          console.error('[ArticleContent] Error loading article content:', error);
          toast({
            title: "Erro ao carregar trabalho",
            description: error.message || "Não foi possível carregar o conteúdo do artigo. Tente novamente.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      loadContent();
    }
  }, [id, user, toast]);

  return {
    content,
    isLoading,
    handleChange,
    addTheoreticalTopic,
    updateTheoreticalTopic,
    removeTheoreticalTopic,
    reorderTheoreticalTopics,
  };
};
