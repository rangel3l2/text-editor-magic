
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export interface BannerContent {
  title: string;
  authors: string;
  authorEmail: string;
  institution: string;
  institutionLogo?: string;
  eventLogo?: string;
  introduction: string;
  objectives: string;
  methodology: string;
  results: string;
  discussion: string;
  conclusion: string;
  references: string;
  acknowledgments: string;
  previewHtml?: string;
  advisors?: string;
  qrCode?: string;
  themeColor?: string;
  columnLayout?: '2' | '3';
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
    authorEmail: '',
    institution: '',
    institutionLogo: '',
    eventLogo: '',
    introduction: '',
    objectives: '',
    methodology: '',
    results: '',
    discussion: '',
    conclusion: '',
    references: '',
    acknowledgments: '',
    previewHtml: '',
    advisors: '',
    qrCode: '',
    themeColor: '#1e40af',
    columnLayout: '2'
  };

  const [bannerContent, setBannerContent] = useState<BannerContent>(initialBannerContent);

  const handleChange = (field: string, value: string) => {
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
