import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const toastShownRef = useRef(false);
  const navigate = useNavigate();

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
    // Resetar refs ao montar o componente
    loadingRef.current = false;
    toastShownRef.current = false;
    
    // Prevenir múltiplas chamadas simultâneas
    if (!user || !id || loadingRef.current) {
      return;
    }

    const loadContent = async () => {
      loadingRef.current = true;
      setIsLoading(true);
      setLoadError(null);
      console.log(`[ArticleContent] Loading work ${id} for user ${user.id}`);
      
      try {
        // Primeiro, verificar se o trabalho existe (query leve)
        const { data: workMeta, error: metaError } = await supabase
          .from('work_in_progress')
          .select('id, title, work_type')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (metaError) {
          console.error('[ArticleContent] Supabase error:', metaError);
          throw metaError;
        }
        
        if (!workMeta) {
          console.error('[ArticleContent] Work not found:', id);
          setLoadError('Trabalho não encontrado');
          
          // Mostrar toast apenas uma vez
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast({
              title: "Trabalho não encontrado",
              description: "O trabalho que você tentou abrir não foi encontrado ou foi excluído.",
              variant: "destructive",
            });
            
            // Redirecionar para a página inicial após 2 segundos
            setTimeout(() => {
              navigate('/');
            }, 2000);
          }
          return;
        }

        console.log('[ArticleContent] Work metadata loaded:', workMeta.title);
        
        // Agora carregar o conteúdo completo
        const { data: workData, error: contentError } = await supabase
          .from('work_in_progress')
          .select('content')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (contentError) {
          console.error('[ArticleContent] Error loading content:', contentError);
          throw contentError;
        }

        if (workData?.content) {
          const loadedContent = workData.content as any as ArticleContent;
          console.log('[ArticleContent] Content loaded successfully');
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
        } else {
          // Se não tem conteúdo, iniciar com valores vazios
          console.log('[ArticleContent] No content found, using defaults');
          setContent(initialArticleContent);
        }
      } catch (error: any) {
        console.error('[ArticleContent] Error loading article content:', error);
        const errorMessage = error.message || 'Erro desconhecido';
        setLoadError(errorMessage);
        
        // Mostrar toast apenas uma vez
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast({
            title: "Erro ao carregar trabalho",
            description: errorMessage.includes('Failed to fetch') 
              ? "Erro de conexão. Verifique sua internet e tente novamente."
              : errorMessage,
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    };

    loadContent();

    // Cleanup ao desmontar
    return () => {
      console.log('[ArticleContent] Component unmounting, resetting refs');
      loadingRef.current = false;
      toastShownRef.current = false;
    };
  }, [id, user, navigate]); // Adicionado navigate às dependências

  return {
    content,
    isLoading,
    loadError,
    handleChange,
    addTheoreticalTopic,
    updateTheoreticalTopic,
    removeTheoreticalTopic,
    reorderTheoreticalTopics,
  };
};
