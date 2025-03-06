
import { useState } from 'react';
import { useParams } from 'react-router-dom';
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
  advisors?: string;
}

export const useBannerContent = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Certifique-se de que cada campo tenha seu próprio valor padrão vazio
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
    acknowledgments: '',
    previewHtml: '',
    advisors: ''
  };

  const [bannerContent, setBannerContent] = useState<BannerContent>(initialBannerContent);

  // Função para atualizar apenas o campo específico
  const handleChange = (field: string, value: string) => {
    setBannerContent(prev => {
      // Crie uma cópia para evitar referências
      const updated = { ...prev };
      // Atualize apenas o campo específico
      updated[field as keyof BannerContent] = value;
      return updated;
    });
  };

  const onImageConfigChange = (imageId: string, config: any) => {
    console.log('Image config changed:', imageId, config);
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
