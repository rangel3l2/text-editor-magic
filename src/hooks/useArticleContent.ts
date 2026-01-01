import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toUpperCasePreservingHTML } from '@/utils/textFormatting';
import { Reference } from '@/types/reference';

export interface TheoreticalTopic {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface ArticleImage {
  url: string;
  type: string;
  caption: string;
  source: string;
  section: string;
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
  results: string;
  conclusion: string;
  references: string;
  structuredReferences?: Reference[];
  appendices?: string;
  attachments?: string;
  approvalDate?: string;
  images?: ArticleImage[];
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
    results: '',
    conclusion: '',
    references: '',
    structuredReferences: [],
    appendices: '',
    attachments: '',
    approvalDate: '',
    images: [],
  };

  const [content, setContent] = useState<ArticleContent>(initialArticleContent);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const toastShownRef = useRef(false);
  const loadedIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const loadControllerRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  const handleChange = (field: keyof ArticleContent, value: string | TheoreticalTopic[]) => {
    // NÃO aplicar conversão para CAIXA ALTA durante a digitação
    // A conversão será aplicada no blur (handleTitleBlur)
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

  // Aplicar conversão para CAIXA ALTA quando o usuário sai do campo
  const handleTitleBlur = (field: 'title' | 'subtitle') => {
    const currentValue = content[field];
    if (currentValue && typeof currentValue === 'string') {
      const uppercased = toUpperCasePreservingHTML(currentValue);
      if (uppercased !== currentValue) {
        // Atualizar estado local
        setContent(prev => ({
          ...prev,
          [field]: uppercased
        }));
        
        // Salvar no banco com valor convertido
        if (user && id && mountedRef.current) {
          const saveContent = async () => {
            try {
              const { error } = await supabase
                .from('work_in_progress')
                .update({ 
                  content: { ...content, [field]: uppercased } as any,
                  last_modified: new Date().toISOString()
                })
                .eq('id', id)
                .eq('user_id', user.id);

              if (error) throw error;
            } catch (error) {
              console.error('Error saving title/subtitle on blur:', error);
            }
          };
          saveContent();
        }
      }
    }
  };

  // Nova função para atualizar múltiplos campos de uma vez (usado no import)
  const updateMultipleFields = (updates: Partial<ArticleContent>) => {
    console.log('📝 [updateMultipleFields] Iniciando atualização:', {
      hasUser: !!user,
      hasId: !!id,
      isMounted: mountedRef.current,
      updatesKeys: Object.keys(updates),
      currentTitle: content.title
    });

    // Aplicar conversão para CAIXA ALTA em título e subtítulo (padrão IFMS)
    const processedUpdates = { ...updates };
    if (processedUpdates.title) {
      processedUpdates.title = toUpperCasePreservingHTML(processedUpdates.title);
    }
    if (processedUpdates.subtitle) {
      processedUpdates.subtitle = toUpperCasePreservingHTML(processedUpdates.subtitle);
    }

    const newContent = {
      ...content,
      ...processedUpdates
    };
    
    setContent(newContent);

    // Só salvar se temos user, id e o componente está montado
    if (user && id && mountedRef.current) {
      const saveContent = async () => {
        try {
          console.log('💾 [updateMultipleFields] Salvando no Supabase...', {
            workId: id,
            userId: user.id,
            contentTitle: newContent.title
          });

          const { error } = await supabase
            .from('work_in_progress')
            .update({ 
              content: newContent as any,
              last_modified: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) {
            console.error('❌ [updateMultipleFields] Erro ao salvar:', error);
            throw error;
          }
          
          console.log('✅ Conteúdo importado salvo com sucesso no banco de dados');
          
          toast({
            title: "✅ Trabalho salvo!",
            description: "O conteúdo importado foi salvo permanentemente.",
            duration: 3000,
          });
        } catch (error) {
          console.error('Error saving article content:', error);
          if (mountedRef.current) {
            toast({
              title: "Erro ao salvar importação",
              description: "Não foi possível salvar o conteúdo importado. Tente novamente.",
              variant: "destructive",
            });
          }
        }
      };

      saveContent();
    } else {
      console.warn('⚠️ [updateMultipleFields] Salvamento ignorado:', {
        hasUser: !!user,
        hasId: !!id,
        isMounted: mountedRef.current
      });
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
      
      // Abort previous in-flight load, then create a new controller
      if (loadControllerRef.current) {
        try { loadControllerRef.current.abort(); } catch {}
      }
      const controller = new AbortController();
      loadControllerRef.current = controller;
      
      try {
        // Carregar metadados e conteúdo em uma única consulta (reduz requisições)
        const { data: work, error } = await supabase
          .from('work_in_progress')
          .select('id, title, work_type, content')
          .eq('id', id)
          .eq('user_id', user.id)
          .abortSignal(controller.signal)
          .maybeSingle();

        if (!mountedRef.current) return;

        if (error) {
          console.error('[ArticleContent] Supabase error:', error);
          throw error;
        }
        
        if (!work) {
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

        console.log('[ArticleContent] Work loaded:', work.title);
        
        const loadedContent = (work.content as any as ArticleContent) ?? initialArticleContent;
        
        if (mountedRef.current) {
          setContent(loadedContent);
          loadedIdRef.current = id;
        }

      } catch (error: any) {
        if (!mountedRef.current) return;
        
        // Ignorar AbortError (cancelamento intencional durante unmount/refresh)
        if (error.name === 'AbortError' || error.code === '20') {
          console.log('[ArticleContent] Request cancelled (component unmounted)');
          return;
        }
        
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
          
          // Mantemos o usuário na página para permitir tentar novamente
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          loadingRef.current = false;
        }
        // Limpa o controlador de carregamento
        loadControllerRef.current = null;
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
      // Aborta qualquer requisição em andamento
      if (loadControllerRef.current) {
        try { loadControllerRef.current.abort(); } catch {}
        loadControllerRef.current = null;
      }
    };
  }, [id, user, navigate, toast]);

  return {
    content,
    isLoading,
    loadError,
    handleChange,
    handleTitleBlur,
    updateMultipleFields,
    addTheoreticalTopic,
    updateTheoreticalTopic,
    removeTheoreticalTopic,
    reorderTheoreticalTopics,
    workId: id || null,
  };
};
