import { useState } from "react";
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import Header from './Header';
import BannerHeaderSection from './banner/BannerHeaderSection';
import BannerContentSection from './banner/BannerContentSection';
import BannerActions from './banner/BannerActions';
import BannerHeader from './banner/BannerHeader';
import BannerPreview from './banner/BannerPreview';
import ImageEditor from './banner/ImageEditor';
import { useBannerContent } from './banner/useBannerContent';
import { generateDocx } from "@/utils/docx/docxGenerator";
import { supabase } from "@/integrations/supabase/client";

const BannerEditor = () => {
  const [searchParams] = useSearchParams();
  const [documentType] = useState(searchParams.get('type') || 'banner');
  const [previewOpen, setPreviewOpen] = useState(false);
  const { bannerContent, setBannerContent, handleChange, initialBannerContent, STORAGE_KEY } = useBannerContent();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

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

  const handleGenerateDocx = async () => {
    try {
      const blob = await generateDocx(bannerContent);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'banner-academico.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "DOCX gerado",
        description: "Seu banner acadêmico foi exportado com sucesso",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generating DOCX:', error);
      toast({
        title: "Erro ao gerar DOCX",
        description: "Ocorreu um erro ao gerar o documento. Tente novamente.",
        duration: 3000,
      });
    }
  };

  const handleShare = async () => {
    try {
      const blob = await generateDocx(bannerContent);
      const file = new File([blob], 'banner-academico.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Banner Acadêmico',
          text: 'Compartilhar banner acadêmico'
        });
        
        toast({
          title: "Compartilhamento iniciado",
          description: "Escolha como deseja compartilhar seu banner",
          duration: 3000,
        });
      } else {
        const url = window.URL.createObjectURL(blob);
        const tempLink = document.createElement('a');
        tempLink.href = url;
        tempLink.download = 'banner-academico.docx';
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download iniciado",
          description: "O arquivo foi preparado para download no seu computador",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error sharing document:', error);
      toast({
        title: "Erro ao compartilhar",
        description: "Ocorreu um erro ao compartilhar o documento",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleLoadSavedContent = () => {
    try {
      const savedContent = localStorage.getItem(STORAGE_KEY);
      if (savedContent) {
        const parsedContent = JSON.parse(savedContent);
        setBannerContent({
          ...initialBannerContent,
          ...parsedContent
        });
        toast({
          title: "Conteúdo recuperado",
          description: "Seu conteúdo foi carregado com sucesso",
          duration: 3000,
        });
      } else {
        toast({
          title: "Nenhum conteúdo encontrado",
          description: "Não há conteúdo salvo anteriormente",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error loading saved content:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar o conteúdo salvo",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleClearFields = () => {
    setBannerContent(initialBannerContent);
    localStorage.removeItem(STORAGE_KEY);
    
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
    
    toast({
      title: "Campos limpos",
      description: "Todos os campos e dados salvos foram limpos com sucesso",
      duration: 3000,
    });
  };

  if (documentType !== 'banner') {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Tipo de documento não suportado ainda</h2>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <BannerHeader title="Banner Acadêmico" />
            <BannerActions 
              onGenerateDocx={handleGenerateDocx}
              onShare={handleShare}
              onLoadSavedContent={handleLoadSavedContent}
              onClearFields={handleClearFields}
              isAuthenticated={!!user}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Tabs defaultValue="header" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="header">Cabeçalho do Banner</TabsTrigger>
                  <TabsTrigger value="content">Conteúdo do Banner</TabsTrigger>
                </TabsList>
                <TabsContent value="header">
                  <BannerHeaderSection content={bannerContent} handleChange={handleChange} />
                </TabsContent>
                <TabsContent value="content">
                  <BannerContentSection content={bannerContent} handleChange={handleChange} />
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="space-y-6">
              <BannerPreview 
                content={bannerContent}
                onImageConfigChange={handleImageConfigChange}
              />
              {selectedImage && (
                <ImageEditor
                  imageUrl={selectedImage}
                  config={{}}
                  onConfigChange={(config) => {
                    handleImageConfigChange(selectedImage, config);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <BannerPreview 
            content={bannerContent}
            onImageConfigChange={handleImageConfigChange}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BannerEditor;