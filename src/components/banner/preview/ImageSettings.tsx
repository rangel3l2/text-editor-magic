import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import ImageCropDialog, { ImageConfig } from '../ImageCropDialog';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Json } from '@/integrations/supabase/types';

interface ImageSettings {
  [key: string]: ImageConfig;
}

interface ImageSettingsProps {
  selectedImage: string | null;
  isImageDialogOpen: boolean;
  setIsImageDialogOpen: (open: boolean) => void;
  imageSettings: ImageSettings;
  setImageSettings: React.Dispatch<React.SetStateAction<ImageSettings>>;
}

const ImageSettings = ({
  selectedImage,
  isImageDialogOpen,
  setIsImageDialogOpen,
  imageSettings,
  setImageSettings
}: ImageSettingsProps) => {
  const { toast } = useToast();

  const handleImageSave = async (config: ImageConfig) => {
    if (!selectedImage) return;

    try {
      // Garantir que o usuário está autenticado (RLS exige user_id)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Faça login",
          description: "Você precisa estar logado para salvar os ajustes da imagem.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      setImageSettings(prev => ({
        ...prev,
        [selectedImage]: config
      }));

      const { error } = await supabase
        .from('banner_images')
        .upsert({
          image_url: selectedImage,
          position_data: config as Json,
          user_id: user.id,
        });

      if (error) throw error;

      setIsImageDialogOpen(false);
      toast({
        title: "Imagem atualizada",
        description: "As alterações na imagem foram salvas com sucesso",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error saving image settings:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações da imagem",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
      <DialogContent className="max-w-[95vw] w-[800px] max-h-[95vh] p-6">
        <VisuallyHidden>
          <DialogTitle>Configurações da Imagem</DialogTitle>
          <DialogDescription>Ajuste de posição, recorte e alinhamento da imagem</DialogDescription>
        </VisuallyHidden>
        <ImageCropDialog
          imageUrl={selectedImage || ''}
          initialConfig={selectedImage ? imageSettings[selectedImage] : undefined}
          onSave={handleImageSave}
          onCancel={() => setIsImageDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ImageSettings;