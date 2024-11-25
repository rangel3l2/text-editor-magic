import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { FileDown, RotateCcw } from "lucide-react";
import BannerHeaderSection from './banner/BannerHeaderSection';
import BannerContentSection from './banner/BannerContentSection';
import { generateDocx } from '@/utils/docxGenerator';
import Header from './Header';
import { useAuth } from "@/contexts/AuthContext";

const BannerEditor = () => {
  const [searchParams] = useSearchParams();
  const [documentType] = useState(searchParams.get('type') || 'banner');
  const [bannerContent, setBannerContent] = useState({
    title: '',
    authors: '',
    introduction: '',
    objectives: '',
    methodology: '',
    results: '',
    conclusion: '',
    references: '',
    acknowledgments: ''
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    // Try to load saved content when component mounts
    const savedContent = localStorage.getItem('bannerContent');
    if (savedContent) {
      setBannerContent(JSON.parse(savedContent));
    }
  }, []);
  
  const handleChange = (field: string, data: string) => {
    setBannerContent(prev => ({
      ...prev,
      [field]: data
    }));
    
    localStorage.setItem('bannerContent', JSON.stringify({
      ...bannerContent,
      [field]: data
    }));
    
    toast({
      title: "Conteúdo salvo",
      description: "Seu conteúdo foi salvo automaticamente",
      duration: 2000,
    });
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

  const handleLoadSavedContent = () => {
    const savedContent = localStorage.getItem('bannerContent');
    if (savedContent) {
      setBannerContent(JSON.parse(savedContent));
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
            <h2 className="text-2xl font-bold">Banner Acadêmico</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {user && (
                <Button 
                  onClick={handleLoadSavedContent}
                  variant="outline"
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <RotateCcw className="h-4 w-4" />
                  Recuperar Dados Salvos
                </Button>
              )}
              <Button 
                onClick={handleGenerateDocx}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto"
              >
                <FileDown className="h-4 w-4" />
                Gerar DOCX
              </Button>
            </div>
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