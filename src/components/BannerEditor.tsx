import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from 'react-router-dom';
import BannerHeaderSection from './banner/BannerHeaderSection';
import BannerContentSection from './banner/BannerContentSection';

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

  if (documentType !== 'banner') {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Tipo de documento não suportado ainda</h2>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Banner Acadêmico</h2>
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
  );
};

export default BannerEditor;