import { useState, useEffect } from 'react';

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
}

export const useBannerContent = () => {
  const STORAGE_KEY = 'banner_content';
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

  useEffect(() => {
    const savedContent = localStorage.getItem(STORAGE_KEY);
    if (savedContent) {
      try {
        const parsedContent = JSON.parse(savedContent);
        setBannerContent(prevContent => ({
          ...initialBannerContent,
          ...parsedContent
        }));
      } catch (error) {
        console.error('Error parsing saved content:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bannerContent));
  }, [bannerContent]);

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
    STORAGE_KEY
  };
};