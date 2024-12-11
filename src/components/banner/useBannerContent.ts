import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface BannerContent {
  title: string;
  authors: string;
  introduction: string;
  objectives: string;
  methodology: string;
  results: string;
  conclusion: string;
  references: string;
  acknowledgments: string;
}

const STORAGE_KEY = 'bannerContent';

export const initialBannerContent: BannerContent = {
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

export const useBannerContent = () => {
  const [bannerContent, setBannerContent] = useState<BannerContent>(initialBannerContent);
  const { toast } = useToast();

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
      console.log('Saved content:', updatedContent); // Debug log
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

  return {
    bannerContent,
    setBannerContent,
    handleChange,
    STORAGE_KEY,
  };
};