
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

  // Define default empty values for each field
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

  // Initialize state with the empty values
  const [bannerContent, setBannerContent] = useState<BannerContent>(initialBannerContent);

  // Updated function to properly type the field parameter
  const handleChange = (field: keyof BannerContent, value: string) => {
    setBannerContent(prev => ({
      ...prev,
      [field]: value
    }));
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
