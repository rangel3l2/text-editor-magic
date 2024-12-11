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
const TITLE_COOKIE_KEY = 'bannerTitle';

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

const setCookie = (name: string, value: string, days: number = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

export const useBannerContent = () => {
  const [bannerContent, setBannerContent] = useState<BannerContent>(initialBannerContent);
  const { toast } = useToast();

  // Load saved content on component mount
  useEffect(() => {
    try {
      // Load from localStorage
      const savedContent = localStorage.getItem(STORAGE_KEY);
      // Load title from cookie
      const savedTitle = getCookie(TITLE_COOKIE_KEY);
      
      if (savedContent) {
        const parsedContent = JSON.parse(savedContent);
        // Verify if all required fields exist in saved content
        const updatedContent = {
          ...initialBannerContent,
          ...parsedContent
        };
        
        // If there's a title in cookie, use it
        if (savedTitle) {
          updatedContent.title = savedTitle;
        }
        
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
      // Save all content to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedContent));
      
      // Additionally save title to cookie if that's what changed
      if (field === 'title') {
        setCookie(TITLE_COOKIE_KEY, data);
      }
      
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