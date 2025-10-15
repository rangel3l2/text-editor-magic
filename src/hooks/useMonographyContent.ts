
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
  theoreticalTopics: TheoreticalTopic[];
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
    theoreticalTopics: [],
    development: '',
    conclusion: '',
    references: '',
    approvalDate: '',
  };

  const [content, setContent] = useState<MonographyContent>(initialMonographyContent);

  const handleChange = (field: keyof MonographyContent, value: string | TheoreticalTopic[]) => {
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
        try {
          const { data, error } = await supabase
            .from('work_in_progress')
            .select('content')
            .eq('id', id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) throw error;
          if (data?.content) {
            setContent(data.content as any as MonographyContent);
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
    addTheoreticalTopic,
    updateTheoreticalTopic,
    removeTheoreticalTopic,
    reorderTheoreticalTopics,
  };
};
