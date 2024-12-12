import { useState } from "react";
import { useSearchParams } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";
import BannerHeader from './banner/BannerHeader';
import BannerActions from './banner/BannerActions';
import BannerLayout from './banner/BannerLayout';
import BannerContent from './banner/BannerContent';
import { useBannerContent } from './banner/useBannerContent';
import { useBannerActions } from './banner/useBannerActions';

const BannerEditor = () => {
  const [searchParams] = useSearchParams();
  const [documentType] = useState(searchParams.get('type') || 'banner');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { bannerContent, setBannerContent, handleChange, initialBannerContent, STORAGE_KEY } = useBannerContent();
  const { 
    handleGeneratePDF, 
    handleShare, 
    handleLoadSavedContent, 
    handleClearFields 
  } = useBannerActions(bannerContent, setBannerContent, initialBannerContent, STORAGE_KEY);

  const handleImageConfigChange = async (imageId: string, config: any) => {
    try {
      const { error } = await supabase
        .from('banner_images')
        .update({
          crop_data: config.crop,
          position_data: config.position
        })
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações da imagem foram atualizadas",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating image config:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações da imagem",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  if (documentType !== 'banner') {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Tipo de documento não suportado ainda</h2>
      </div>
    );
  }

  return (
    <BannerLayout 
      previewOpen={previewOpen}
      setPreviewOpen={setPreviewOpen}
      content={bannerContent}
      onImageConfigChange={handleImageConfigChange}
    >
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <BannerHeader title="Banner Acadêmico" />
        <BannerActions 
          onGeneratePDF={handleGeneratePDF}
          onShare={handleShare}
          onLoadSavedContent={handleLoadSavedContent}
          onClearFields={handleClearFields}
          isAuthenticated={!!user}
        />
      </div>
      
      <BannerContent 
        content={bannerContent}
        handleChange={handleChange}
        selectedImage={selectedImage}
        onImageConfigChange={handleImageConfigChange}
        onOpenPreview={() => setPreviewOpen(true)}
      />
    </BannerLayout>
  );
};

export default BannerEditor;