import { useState, useEffect } from 'react';
import { FileImage, BarChart3, Table2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface BannerAttachmentsManagerProps {
  pendingImageFile?: File | null;
  onImageProcessed?: () => void;
}

const BannerAttachmentsManager = ({ pendingImageFile, onImageProcessed }: BannerAttachmentsManagerProps) => {
  const { id: workId } = useParams();
  const { user } = useAuth();
  const [editingImage, setEditingImage] = useState<BannerImage | null>(null);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('images');
  const [selectionMode, setSelectionMode] = useState<{ sectionId: string; type: 'figura' | 'grafico' | 'tabela' } | null>(null);
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

  // Escutar evento de requisição de inserção de anexo
  useEffect(() => {
    const handleOpenAttachmentsManager = (event: CustomEvent) => {
      const { type, sectionId } = event.detail;
      setSelectionMode({ sectionId, type });
      
      // Abrir na aba correta
      if (type === 'figura') setActiveTab('images');
      else if (type === 'grafico') setActiveTab('charts');
      else if (type === 'tabela') setActiveTab('tables');
      
      setOpen(true);
    };

    window.addEventListener('openAttachmentsManager' as any, handleOpenAttachmentsManager);
    return () => {
      window.removeEventListener('openAttachmentsManager' as any, handleOpenAttachmentsManager);
    };
  }, []);

  // Process pending image from editor
  useEffect(() => {
    if (pendingImageFile) {
      handleUpload(pendingImageFile, 'figura', 'Imagem do editor', 'Inserida via editor de texto', 'results');
      if (onImageProcessed) {
        onImageProcessed();
      }
      toast({
        title: "Imagem capturada",
        description: "A imagem foi adicionada à galeria. Abra o menu de anexos para gerenciá-la.",
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

  const handleSelectAttachment = (imageId: string, imageType: string) => {
    if (selectionMode) {
      // Disparar evento para o BannerContentSection inserir o anexo
      const event = new CustomEvent('attachmentSelected', {
        detail: {
          sectionId: selectionMode.sectionId,
          attachmentId: imageId,
          attachmentType: imageType
        }
      });
      window.dispatchEvent(event);
      
      setSelectionMode(null);
      setOpen(false);
      toast({
        title: "Anexo inserido",
        description: "O anexo foi inserido no texto na posição do cursor.",
        duration: 2000,
      });
    }
  };

  const hasLowDPI = images.some(img => img.dpi < 200);
  const hasMissingCaptions = images.some(img => !img.caption || img.caption.length < 10);
  
  const imageCount = images.filter(img => img.image_type === 'figura').length;
  const chartCount = images.filter(img => img.image_type === 'grafico').length;
  const tableCount = images.filter(img => img.image_type === 'tabela').length;

  return (
    <>
      {/* Floating Action Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="group fixed right-4 sm:right-6 bottom-20 sm:bottom-6 z-50 h-16 w-16 sm:h-14 sm:w-14 rounded-full shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-110 bg-gradient-to-br from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary hover:to-primary animate-fade-in border-2 border-primary-foreground/20"
          >
            <div className="relative">
              <Paperclip className="h-6 w-6 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:rotate-12 text-primary-foreground" />
              {(imageCount + chartCount + tableCount) > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 bg-destructive rounded-full text-[10px] font-bold flex items-center justify-center text-destructive-foreground animate-scale-in border-2 border-background">
                  {imageCount + chartCount + tableCount}
                </span>
              )}
            </div>
            <span className="sr-only">Gerenciar Anexos do Banner</span>
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-full sm:w-[600px] md:w-[700px] p-0 flex flex-col"
        >
          <SheetHeader className="px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-muted/30 to-muted/50">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Paperclip className="h-5 w-5 text-primary" />
              </div>
              Anexos do Banner
            </SheetTitle>
            <SheetDescription className="text-sm mt-1">
              Gerencie imagens, gráficos e tabelas do seu banner científico
            </SheetDescription>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 sm:px-6 pt-4 border-b bg-muted/20 flex-shrink-0">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                <TabsTrigger value="images" className="text-xs sm:text-sm data-[state=active]:bg-background">
                  <FileImage className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Imagens</span>
                  {imageCount > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5">
                      {imageCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="charts" className="text-xs sm:text-sm data-[state=active]:bg-background">
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Gráficos</span>
                  {chartCount > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5">
                      {chartCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="tables" className="text-xs sm:text-sm data-[state=active]:bg-background">
                  <Table2 className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Tabelas</span>
                  {tableCount > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5">
                      {tableCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 h-[calc(100vh-280px)]">
              {/* Images Tab */}
              <TabsContent value="images" className="mt-0 px-4 sm:px-6 py-6 space-y-6 h-full">
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

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Suas Imagens ({imageCount})
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
                      images={images.filter(img => img.image_type === 'figura')}
                      onReorder={reorderImages}
                      onEdit={setEditingImage}
                      onDelete={deleteImage}
                      selectionMode={selectionMode?.type === 'figura'}
                      onSelect={handleSelectAttachment}
                    />
                  )}
                </div>
              </TabsContent>

              {/* Charts Tab */}
              <TabsContent value="charts" className="mt-0 px-4 sm:px-6 py-6 space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="text-muted-foreground mb-3">
                    <strong>💡 Dica:</strong> Para adicionar gráficos ao banner, crie-os como imagens e faça upload na aba "Imagens" selecionando o tipo "Gráfico".
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Você pode usar ferramentas externas como Excel, Google Sheets ou ferramentas de visualização de dados para criar seus gráficos e salvá-los como imagem.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Seus Gráficos ({chartCount})
                    </h3>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      Carregando gráficos...
                    </div>
                  ) : chartCount > 0 ? (
                    <BannerImageGallery
                      images={images.filter(img => img.image_type === 'grafico')}
                      onReorder={reorderImages}
                      onEdit={setEditingImage}
                      onDelete={deleteImage}
                      selectionMode={selectionMode?.type === 'grafico'}
                      onSelect={handleSelectAttachment}
                    />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum gráfico adicionado ainda</p>
                      <p className="text-sm mt-1">Adicione um gráfico na aba "Imagens"</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tables Tab */}
              <TabsContent value="tables" className="mt-0 px-4 sm:px-6 py-6 space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="text-muted-foreground mb-3">
                    <strong>💡 Dica:</strong> Para adicionar tabelas ao banner, crie-as como imagens e faça upload na aba "Imagens" selecionando o tipo "Tabela".
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Você pode usar ferramentas como Excel, Google Sheets ou Word para criar suas tabelas e salvá-las como imagem de alta qualidade.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Suas Tabelas ({tableCount})
                    </h3>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      Carregando tabelas...
                    </div>
                  ) : tableCount > 0 ? (
                    <BannerImageGallery
                      images={images.filter(img => img.image_type === 'tabela')}
                      onReorder={reorderImages}
                      onEdit={setEditingImage}
                      onDelete={deleteImage}
                      selectionMode={selectionMode?.type === 'tabela'}
                      onSelect={handleSelectAttachment}
                    />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Table2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma tabela adicionada ainda</p>
                      <p className="text-sm mt-1">Adicione uma tabela na aba "Imagens"</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
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

export default BannerAttachmentsManager;
