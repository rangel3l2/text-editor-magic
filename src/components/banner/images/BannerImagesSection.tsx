import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useBannerImages } from '@/hooks/useBannerImages';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import BannerImageUpload from './BannerImageUpload';
import BannerImageGallery from './BannerImageGallery';
import BannerImageEditor from './BannerImageEditor';
import { BannerImage } from '@/hooks/useBannerImages';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BannerImagesSection = () => {
  const { id: workId } = useParams();
  const { user } = useAuth();
  const [editingImage, setEditingImage] = useState<BannerImage | null>(null);
  
  const {
    images,
    isLoading,
    isUploading,
    uploadImage,
    updateImage,
    deleteImage,
    reorderImages
  } = useBannerImages(workId, user?.id);

  const handleUpload = async (file: File, caption?: string) => {
    const image = await uploadImage(file);
    if (image && caption) {
      const figureNumber = images.length + 1;
      const fullCaption = `Figura ${figureNumber}: ${caption}`;
      await updateImage(image.id, { caption: fullCaption });
    }
  };

  const handleSaveEdit = async (imageId: string, updates: Partial<BannerImage>) => {
    await updateImage(imageId, updates);
  };

  const hasLowDPI = images.some(img => img.dpi < 200);
  const hasMissingCaptions = images.some(img => !img.caption || img.caption.length < 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>📷 Imagens e Figuras</CardTitle>
        <CardDescription>
          Adicione imagens, gráficos e tabelas para seus resultados.
          As imagens serão automaticamente posicionadas nas colunas e numeradas como Figura 1, Figura 2, etc.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alerts */}
        {hasLowDPI && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Algumas imagens têm resolução abaixo de 200 DPI.
              Para melhor qualidade de impressão, recomendamos usar imagens com pelo menos 300 DPI.
            </AlertDescription>
          </Alert>
        )}

        {hasMissingCaptions && images.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Lembrete:</strong> Não esqueça de adicionar legendas descritivas para todas as imagens.
              As legendas devem ser objetivas e explicar o conteúdo da figura.
            </AlertDescription>
          </Alert>
        )}

        {images.length >= 9 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Limite de imagens:</strong> Recomendamos no máximo 3 imagens por coluna (9 no total)
              para manter o banner visualmente equilibrado.
            </AlertDescription>
          </Alert>
        )}

        {/* Upload */}
        <BannerImageUpload
          onUpload={handleUpload}
          isUploading={isUploading}
          maxImages={10}
          currentCount={images.length}
        />

        {/* Gallery */}
        {!isLoading && (
          <BannerImageGallery
            images={images}
            onReorder={reorderImages}
            onEdit={setEditingImage}
            onDelete={deleteImage}
          />
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Editor Dialog */}
        <BannerImageEditor
          image={editingImage}
          isOpen={!!editingImage}
          onClose={() => setEditingImage(null)}
          onSave={handleSaveEdit}
        />
      </CardContent>
    </Card>
  );
};

export default BannerImagesSection;
