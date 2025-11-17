import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface BannerImage {
  id: string;
  work_id: string;
  user_id: string;
  storage_path: string;
  display_order: number;
  caption: string;
  column_position: number | null;
  width_cm: number | null;
  height_cm: number | null;
  crop_data: any;
  rotation: number;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  original_width: number;
  original_height: number;
  dpi: number;
  url?: string;
}

export const useBannerImages = (workId: string | undefined, userId: string | undefined) => {
  const [images, setImages] = useState<BannerImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Load images
  useEffect(() => {
    if (!workId || !userId) return;

    const loadImages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('banner_work_images')
          .select('*')
          .eq('work_id', workId)
          .eq('user_id', userId)
          .order('display_order', { ascending: true });

        if (error) throw error;

        // Get public URLs for images
        const imagesWithUrls = await Promise.all(
          (data || []).map(async (img) => {
            const { data: urlData } = supabase.storage
              .from('banner_images')
              .getPublicUrl(img.storage_path);
            
            return {
              ...img,
              adjustments: img.adjustments as { brightness: number; contrast: number; saturation: number },
              url: urlData.publicUrl
            } as BannerImage;
          })
        );

        setImages(imagesWithUrls);
      } catch (error) {
        console.error('Error loading images:', error);
        toast({
          title: 'Erro ao carregar imagens',
          description: 'Não foi possível carregar as imagens do banner',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadImages();
  }, [workId, userId, toast]);

  // Upload image
  const uploadImage = async (file: File): Promise<BannerImage | null> => {
    if (!workId || !userId) return null;

    setIsUploading(true);
    try {
      // Get image dimensions
      const img = await loadImageDimensions(file);
      const dpi = calculateDPI(img.width, img.height, file.size);

      // Check DPI
      if (dpi < 200) {
        toast({
          title: '⚠️ Resolução baixa detectada',
          description: `Esta imagem tem ${dpi} DPI. Recomendamos 300 DPI para melhor qualidade de impressão.`,
          variant: 'default'
        });
      }

      // Upload to storage
      const fileName = `${userId}/${workId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('banner_images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create metadata record
      const { data: imageData, error: insertError } = await supabase
        .from('banner_work_images')
        .insert({
          work_id: workId,
          user_id: userId,
          storage_path: uploadData.path,
          display_order: images.length,
          caption: '',
          original_width: img.width,
          original_height: img.height,
          dpi: dpi
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('banner_images')
        .getPublicUrl(uploadData.path);

      const newImage = {
        ...imageData,
        adjustments: imageData.adjustments as { brightness: number; contrast: number; saturation: number },
        url: urlData.publicUrl
      } as BannerImage;

      setImages([...images, newImage]);

      toast({
        title: '✅ Imagem adicionada',
        description: 'Imagem carregada com sucesso'
      });

      return newImage;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível fazer upload da imagem',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Update image metadata
  const updateImage = async (imageId: string, updates: Partial<BannerImage>) => {
    try {
      const { error } = await supabase
        .from('banner_work_images')
        .update(updates)
        .eq('id', imageId);

      if (error) throw error;

      setImages(images.map(img => 
        img.id === imageId ? { ...img, ...updates } : img
      ));

      toast({
        title: 'Imagem atualizada',
        description: 'Alterações salvas com sucesso'
      });
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar a imagem',
        variant: 'destructive'
      });
    }
  };

  // Delete image
  const deleteImage = async (imageId: string) => {
    try {
      const image = images.find(img => img.id === imageId);
      if (!image) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('banner_images')
        .remove([image.storage_path]);

      if (storageError) throw storageError;

      // Delete metadata
      const { error: dbError } = await supabase
        .from('banner_work_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      // Update local state immediately
      const remainingImages = images.filter(img => img.id !== imageId);
      
      // Renumber and update in database
      const updates = remainingImages.map((img, index) => ({
        ...img,
        display_order: index,
        caption: img.caption.replace(/Figura \d+/, `Figura ${index + 1}`)
      }));

      // Update database
      for (const update of updates) {
        await supabase
          .from('banner_work_images')
          .update({ 
            display_order: update.display_order,
            caption: update.caption 
          })
          .eq('id', update.id);
      }

      // Update state with renumbered images
      setImages(updates);

      toast({
        title: 'Imagem removida',
        description: 'Imagem excluída com sucesso'
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a imagem',
        variant: 'destructive'
      });
    }
  };

  // Reorder images (drag and drop)
  const reorderImages = async (newOrder: BannerImage[]) => {
    try {
      const updates = newOrder.map((img, index) => ({
        id: img.id,
        display_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('banner_work_images')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      // Renumber captions
      const renumbered = newOrder.map((img, index) => ({
        ...img,
        display_order: index,
        caption: img.caption.replace(/Figura \d+/, `Figura ${index + 1}`)
      }));

      setImages(renumbered);
    } catch (error) {
      console.error('Error reordering images:', error);
    }
  };

  return {
    images,
    isLoading,
    isUploading,
    uploadImage,
    updateImage,
    deleteImage,
    reorderImages
  };
};

// Helper functions
const loadImageDimensions = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

const calculateDPI = (widthPx: number, heightPx: number, fileSize: number): number => {
  // Estimate DPI based on dimensions and file size
  // This is an approximation
  const widthInches = widthPx / 96; // Assume screen DPI of 96
  const heightInches = heightPx / 96;
  const avgInches = (widthInches + heightInches) / 2;
  const avgPixels = (widthPx + heightPx) / 2;
  
  return Math.round(avgPixels / avgInches);
};
