import { useState, useEffect } from 'react';
import { FileImage, BarChart3, Table2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBannerImages } from '@/hooks/useBannerImages';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import BannerImageUpload from '@/components/banner/images/BannerImageUpload';
import BannerImageGallery from '@/components/banner/images/BannerImageGallery';
import BannerImageEditor from '@/components/banner/images/BannerImageEditor';
import { BannerImage } from '@/hooks/useBannerImages';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ArticleAttachmentsManagerProps {
  pendingImageFile?: File | null;
  onImageProcessed?: () => void;
}

const ArticleAttachmentsManager = ({ pendingImageFile, onImageProcessed }: ArticleAttachmentsManagerProps) => {
  const { id: workId } = useParams();
  const { user } = useAuth();
  const [editingImage, setEditingImage] = useState<BannerImage | null>(null);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('images');
  const [selectionMode, setSelectionMode] = useState<{ sectionId: string; type: 'figura' | 'grafico' | 'tabela'; placeholderId?: string } | null>(null);
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
      const { type, sectionId, placeholderId } = event.detail;
      setSelectionMode({ sectionId, type, placeholderId });
      
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
    console.log('🎯 Anexo selecionado:', { imageId, imageType, selectionMode });
    if (selectionMode) {
      // Disparar evento para inserir o anexo no editor
      const event = new CustomEvent('attachmentSelected', {
        detail: {
          sectionId: selectionMode.sectionId,
          attachmentId: imageId,
          attachmentType: imageType,
          placeholderId: selectionMode.placeholderId
        }
      });
      window.dispatchEvent(event);
      console.log('📤 Evento attachmentSelected disparado:', event.detail);
      
      setSelectionMode(null);
      setOpen(false);
      toast({
        title: "Anexo inserido",
        description: "O anexo foi inserido no texto na posição do cursor.",
        duration: 2000,
      });
    } else {
      console.warn('⚠️ Nenhum modo de seleção ativo. Anexo não foi inserido.');
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
          </Button>
        </SheetTrigger>

        <SheetContent 
          side="right" 
          className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Gerenciar Anexos do Artigo
            </SheetTitle>
            <SheetDescription>
              Adicione e gerencie imagens, gráficos e tabelas do seu artigo científico (formato 1 coluna)
            </SheetDescription>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
              <TabsTrigger value="images" className="flex items-center gap-2">
                <FileImage className="h-4 w-4" />
                <span className="hidden sm:inline">Imagens</span>
                {imageCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{imageCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="charts" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Gráficos</span>
                {chartCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{chartCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tables" className="flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                <span className="hidden sm:inline">Tabelas</span>
                {tableCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{tableCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <div className="px-6 pb-6">
                <TabsContent value="images" className="mt-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Figuras</h3>
                      <span className="text-sm text-muted-foreground">
                        Para artigos científicos (1 coluna)
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Adicione imagens ilustrativas, fotografias, esquemas e diagramas.
                      Recomendado: 300 DPI, largura máxima 16cm.
                    </p>
                  </div>

                  {(hasLowDPI || hasMissingCaptions) && (
                    <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-sm">
                        {hasLowDPI && "⚠️ Algumas imagens têm resolução baixa (< 200 DPI). "}
                        {hasMissingCaptions && "⚠️ Algumas imagens precisam de legendas completas."}
                      </AlertDescription>
                    </Alert>
                  )}

                  <BannerImageUpload
                    onUpload={(file, title, source) => handleUpload(file, 'figura', title, source, 'results')}
                    isUploading={isUploading}
                  />

                  <BannerImageGallery
                    images={images.filter(img => img.image_type === 'figura')}
                    onReorder={reorderImages}
                    onEdit={setEditingImage}
                    onDelete={deleteImage}
                    selectionMode={!!selectionMode && selectionMode.type === 'figura'}
                    onSelect={handleSelectAttachment}
                  />
                </TabsContent>

                <TabsContent value="charts" className="mt-4 space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Gráficos</h3>
                    <p className="text-sm text-muted-foreground">
                      Adicione gráficos de barras, linhas, pizza ou outros tipos de visualização de dados.
                      Formato 1 coluna - largura máxima 16cm.
                    </p>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Como adicionar gráficos:</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                        <li>Crie seu gráfico em Excel, Google Sheets ou outro software</li>
                        <li>Exporte como imagem de alta resolução (PNG 300 DPI)</li>
                        <li>Faça upload usando o botão abaixo</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <BannerImageUpload
                    onUpload={(file, title, source) => handleUpload(file, 'grafico', title, source, 'results')}
                    isUploading={isUploading}
                  />

                  <BannerImageGallery
                    images={images.filter(img => img.image_type === 'grafico')}
                    onReorder={reorderImages}
                    onEdit={setEditingImage}
                    onDelete={deleteImage}
                    selectionMode={!!selectionMode && selectionMode.type === 'grafico'}
                    onSelect={handleSelectAttachment}
                  />
                </TabsContent>

                <TabsContent value="tables" className="mt-4 space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Tabelas</h3>
                    <p className="text-sm text-muted-foreground">
                      Adicione tabelas com dados, comparações ou resultados experimentais.
                      Formato 1 coluna - largura máxima 16cm.
                    </p>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Como adicionar tabelas:</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                        <li>Crie sua tabela em Word, Excel ou Google Docs</li>
                        <li>Exporte ou capture como imagem de alta resolução</li>
                        <li>Faça upload usando o botão abaixo</li>
                        <li>Ou use o editor de texto para criar tabelas diretamente</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <BannerImageUpload
                    onUpload={(file, title, source) => handleUpload(file, 'tabela', title, source, 'results')}
                    isUploading={isUploading}
                  />

                  <BannerImageGallery
                    images={images.filter(img => img.image_type === 'tabela')}
                    onReorder={reorderImages}
                    onEdit={setEditingImage}
                    onDelete={deleteImage}
                    selectionMode={!!selectionMode && selectionMode.type === 'tabela'}
                    onSelect={handleSelectAttachment}
                  />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Image Editor Modal */}
      {editingImage && (
        <BannerImageEditor
          image={editingImage}
          isOpen={!!editingImage}
          onClose={() => setEditingImage(null)}
          onSave={async (imageId, updates) => {
            await handleSaveEdit(imageId, updates);
            setEditingImage(null);
          }}
        />
      )}
    </>
  );
};

export default ArticleAttachmentsManager;
