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
  const loadedIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const navigate = useNavigate();

  const handleChange = (field: keyof ArticleContent, value: string | TheoreticalTopic[]) => {
    setContent(prev => ({
      ...prev,
      [field]: value
    }));

    // Só salvar se temos user, id e o componente está montado
    if (user && id && mountedRef.current) {
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
          // Não mostrar toast em todo erro de salvamento para evitar spam
          if (mountedRef.current) {
            toast({
              title: "Erro ao salvar",
              description: "Não foi possível salvar as alterações. Tente novamente.",
              variant: "destructive",
            });
          }
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
    mountedRef.current = true;
    
    // Se já carregamos este ID, não carregar novamente
    if (loadedIdRef.current === id) {
      console.log('[ArticleContent] Already loaded this work, skipping');
      return;
    }
    
    // Prevenir múltiplas chamadas simultâneas
    if (!user || !id || loadingRef.current) {
      console.log('[ArticleContent] Skipping load:', { hasUser: !!user, hasId: !!id, isLoading: loadingRef.current });
      return;
    }

    const loadContent = async () => {
      if (!mountedRef.current) return;
      
      loadingRef.current = true;
      setIsLoading(true);
      setLoadError(null);
      toastShownRef.current = false;
      console.log(`[ArticleContent] Loading work ${id} for user ${user.id}`);
      
      try {
        // Primeiro, verificar se o trabalho existe (query leve)
        const { data: workMeta, error: metaError } = await supabase
          .from('work_in_progress')
          .select('id, title, work_type')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!mountedRef.current) return;

        if (metaError) {
          console.error('[ArticleContent] Supabase error:', metaError);
          throw metaError;
        }
        
        if (!workMeta) {
          console.error('[ArticleContent] Work not found:', id);
          setLoadError('Trabalho não encontrado');
          
          if (!toastShownRef.current && mountedRef.current) {
            toastShownRef.current = true;
            toast({
              title: "Trabalho não encontrado",
              description: "O trabalho que você tentou abrir não foi encontrado ou foi excluído.",
              variant: "destructive",
            });
            
            // Redirecionar para a página inicial
            setTimeout(() => {
              if (mountedRef.current) {
                navigate('/', { replace: true });
              }
            }, 1500);
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

        if (!mountedRef.current) return;

        if (contentError) {
          console.error('[ArticleContent] Error loading content:', contentError);
          throw contentError;
        }

        if (workData?.content) {
          const loadedContent = workData.content as any as ArticleContent;
          console.log('[ArticleContent] Content loaded successfully');
          
          if (mountedRef.current) {
            setContent(loadedContent);
            loadedIdRef.current = id;
          }
        } else {
          console.log('[ArticleContent] No content found, using defaults');
          if (mountedRef.current) {
            setContent(initialArticleContent);
            loadedIdRef.current = id;
          }
        }
      } catch (error: any) {
        if (!mountedRef.current) return;
        
        console.error('[ArticleContent] Error loading article content:', error);
        const errorMessage = error.message || 'Erro desconhecido';
        setLoadError(errorMessage);
        
        if (!toastShownRef.current && mountedRef.current) {
          toastShownRef.current = true;
          toast({
            title: "Erro ao carregar trabalho",
            description: "Não foi possível carregar o trabalho. Tente novamente.",
            variant: "destructive",
          });
          
          // Redirecionar para home em caso de erro persistente
          setTimeout(() => {
            if (mountedRef.current) {
              navigate('/', { replace: true });
            }
          }, 2000);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          loadingRef.current = false;
        }
      }
    };

    // Pequeno delay para evitar race conditions
    const timeoutId = setTimeout(() => {
      loadContent();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      console.log('[ArticleContent] Cleanup: component unmounting');
      mountedRef.current = false;
      loadingRef.current = false;
    };
  }, [id, user]); // Removido navigate e toast das dependências

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
