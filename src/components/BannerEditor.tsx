import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BannerHeaderSection from './banner/BannerHeaderSection';
import BannerContentSection from './banner/BannerContentSection';

const BannerEditor = () => {
  const [documentType, setDocumentType] = useState<string>('');
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
      title: "Content saved",
      description: "Your banner content has been automatically saved",
      duration: 2000,
    });
  };

  if (!documentType) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Selecione o tipo de trabalho acadêmico</h2>
        <Select onValueChange={setDocumentType}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de documento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="banner">Banner Acadêmico</SelectItem>
            <SelectItem value="article">Artigo Científico</SelectItem>
            <SelectItem value="thesis">Tese/Dissertação</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (documentType !== 'banner') {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Tipo de documento não suportado ainda</h2>
        <button 
          onClick={() => setDocumentType('')}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Banner Acadêmico</h2>
        <button 
          onClick={() => setDocumentType('')}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Mudar tipo de documento
        </button>
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