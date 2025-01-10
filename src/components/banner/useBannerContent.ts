import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export interface BannerContent {
  title: string;
  authors: string;
  institution: string;
  institutionLogo?: string;
  introduction: string;
  objectives: string;
  methodology: string;
  results: string;
  conclusion: string;
  references: string;
  acknowledgments: string;
  previewHtml?: string;
}

export const useBannerContent = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const initialBannerContent: BannerContent = {
    title: '',
    authors: '',
    institution: '',
    institutionLogo: '',
    introduction: '',
    objectives: '',
    methodology: '',
    results: '',
    conclusion: '',
    references: '',
    acknowledgments: ''
  };

  const [bannerContent, setBannerContent] = useState<BannerContent>(initialBannerContent);

  // Carregar dados do banner se existir um ID
  useEffect(() => {
    const loadBannerContent = async () => {
      if (!id || !user) return;

      try {
        const { data, error } = await supabase
          .from('work_in_progress')
          .select('content')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data?.content) {
          setBannerContent(prevContent => ({
            ...initialBannerContent,
            ...data.content
          }));
        }
      } catch (error) {
        console.error('Error loading banner content:', error);
        toast({
          title: "Erro ao carregar conteúdo",
          description: "Não foi possível carregar o conteúdo do banner. Por favor, tente novamente.",
          variant: "destructive",
        });
      }
    };

    loadBannerContent();
  }, [id, user, toast]);

  const handleChange = (field: string, value: string) => {
    setBannerContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const onImageConfigChange = (imageId: string, config: any) => {
    console.log('Image config changed:', imageId, config);
    // Implementation for image configuration changes
  };

  return {
    content: bannerContent,
    handleChange,
    selectedImage,
    setSelectedImage,
    onImageConfigChange,
    previewOpen,
    setPreviewOpen,
    bannerContent,
    setBannerContent,
    initialBannerContent,
  };
};