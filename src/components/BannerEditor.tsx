import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from 'react-router-dom';
import { generateDocx } from '@/utils/docxGenerator';
import Header from './Header';
import { useAuth } from "@/contexts/AuthContext";
import BannerHeaderSection from './banner/BannerHeaderSection';
import BannerContentSection from './banner/BannerContentSection';
import BannerActions from './banner/BannerActions';
import BannerHeader from './banner/BannerHeader';

const STORAGE_KEY = 'bannerContent';

const initialBannerContent = {
  title: '',
  authors: '',
  introduction: '',
  objectives: '',
  methodology: '',
  results: '',
  conclusion: '',
  references: '',
  acknowledgments: ''
};

const BannerEditor = () => {
  const [searchParams] = useSearchParams();
  const [documentType] = useState(searchParams.get('type') || 'banner');
  const [bannerContent, setBannerContent] = useState(initialBannerContent);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Load saved content on component mount
  useEffect(() => {
    try {
      const savedContent = localStorage.getItem(STORAGE_KEY);
      if (savedContent) {
        const parsedContent = JSON.parse(savedContent);
        // Verify if all required fields exist in saved content
        const updatedContent = {
          ...initialBannerContent,
          ...parsedContent
        };
        setBannerContent(updatedContent);
        
        toast({
          title: "Conteúdo carregado",
          description: "Seu conteúdo anterior foi recuperado com sucesso",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error loading saved content:', error);
      toast({
        title: "Erro ao carregar conteúdo",
        description: "Não foi possível recuperar o conteúdo salvo",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [toast]);
  
  const handleChange = (field: string, data: string) => {
    const updatedContent = {
      ...bannerContent,
      [field]: data
    };
    
    setBannerContent(updatedContent);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedContent));
      toast({
        title: "Conteúdo salvo",
        description: "Seu conteúdo foi salvo automaticamente",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o conteúdo automaticamente",
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
        title: "Documento gerado",
        description: "Seu banner acadêmico foi exportado com sucesso",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Erro ao gerar documento",
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
      
      let errorMessage = "Ocorreu um erro ao compartilhar o documento.";
      if (error instanceof Error) {
        errorMessage += ` ${error.message}`;
      }
      
      toast({
        title: "Erro ao compartilhar",
        description: errorMessage,
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
    
    toast({
      title: "Campos limpos",
      description: "Todos os campos foram limpos com sucesso",
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
      </main>
    </>
  );
};

export default BannerEditor;