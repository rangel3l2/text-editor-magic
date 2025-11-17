import { useState } from 'react';
import { Images, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useBannerImages } from '@/hooks/useBannerImages';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import BannerImageUpload from './images/BannerImageUpload';
import BannerImageGallery from './images/BannerImageGallery';
import BannerImageEditor from './images/BannerImageEditor';
import { BannerImage } from '@/hooks/useBannerImages';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { useEffect } from 'react';

interface ImageManagerSidebarProps {
  pendingImageFile?: File | null;
  onImageProcessed?: () => void;
}

const ImageManagerSidebar = ({ pendingImageFile, onImageProcessed }: ImageManagerSidebarProps) => {
  const { id: workId } = useParams();
  const { user } = useAuth();
  const [editingImage, setEditingImage] = useState<BannerImage | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const {
    images,
    isLoading,
    isUploading,
    uploadImage,
    updateImage,
    deleteImage,
    reorderImages
  } = useBannerImages(workId, user?.id);

  // Process pending image from editor
  useEffect(() => {
    if (pendingImageFile) {
      handleUpload(pendingImageFile, 'figura', 'Imagem do editor', 'Inserida via editor de texto', 'results');
      if (onImageProcessed) {
        onImageProcessed();
      }
      toast({
        title: "Imagem capturada",
        description: "A imagem foi adicionada à galeria. Abra o menu de imagens para gerenciá-la.",
        duration: 3000,
      });
    }
  }, [pendingImageFile]);

  const handleUpload = async (
    file: File,
    imageType: 'figura' | 'grafico' | 'tabela',
    title: string,
    source: string,
    section: string = 'results'
  ) => {
    const image = await uploadImage(file);
    if (image) {
      const typeLabel = imageType === 'figura' ? 'Figura' : imageType === 'grafico' ? 'Gráfico' : 'Tabela';
      const count = images.filter(img => img.image_type === imageType).length + 1;
      const fullCaption = `${typeLabel} ${count}: ${title}`;
      await updateImage(image.id, {
        caption: fullCaption,
        image_type: imageType,
        source: source,
        section: section
      });
    }
  };

  const handleSaveEdit = async (imageId: string, updates: Partial<BannerImage>) => {
    await updateImage(imageId, updates);
  };

  const hasLowDPI = images.some(img => img.dpi < 200);
  const hasMissingCaptions = images.some(img => !img.caption || img.caption.length < 10);

  return (
    <>
      {/* Floating Action Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed right-4 sm:right-6 bottom-20 sm:bottom-6 z-50 h-16 w-16 sm:h-14 sm:w-14 rounded-full shadow-2xl hover:shadow-xl transition-all hover:scale-110 bg-primary"
          >
            <Images className="h-6 w-6 sm:h-6 sm:w-6" />
            <span className="sr-only">Gerenciar Imagens</span>
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-full sm:w-[540px] md:w-[600px] p-0 flex flex-col"
        >
          <SheetHeader className="px-4 sm:px-6 py-4 border-b bg-muted/30">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Images className="h-5 w-5" />
              Galeria de Imagens
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4 sm:px-6">
            <div className="space-y-6 py-6">
              {/* Alerts */}
              {hasLowDPI && (
                <Alert variant="default" className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-sm">
                    <strong>Atenção:</strong> Algumas imagens têm resolução abaixo de 200 DPI.
                    Para melhor qualidade de impressão, recomendamos usar imagens com pelo menos 300 DPI.
                  </AlertDescription>
                </Alert>
              )}

              {hasMissingCaptions && images.length > 0 && (
                <Alert variant="default" className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm">
                    <strong>Atenção:</strong> Algumas imagens não possuem legendas completas.
                    Adicione descrições para melhorar a qualidade do banner.
                  </AlertDescription>
                </Alert>
              )}

              {/* Upload Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Adicionar Imagem
                  </h3>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <BannerImageUpload
                  onUpload={handleUpload}
                  isUploading={isUploading}
                />
              </div>

              {/* Gallery Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Suas Imagens ({images.length})
                  </h3>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    Carregando imagens...
                  </div>
                ) : (
                  <BannerImageGallery
                    images={images}
                    onReorder={reorderImages}
                    onEdit={setEditingImage}
                    onDelete={deleteImage}
                  />
                )}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Image Editor Dialog */}
      <BannerImageEditor
        image={editingImage}
        isOpen={!!editingImage}
        onSave={handleSaveEdit}
        onClose={() => setEditingImage(null)}
      />
    </>
  );
};

export default ImageManagerSidebar;
