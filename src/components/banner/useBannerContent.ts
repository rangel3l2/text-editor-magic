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

export const STORAGE_KEY = 'bannerContent';
const COOKIE_PREFIX = 'banner_';

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
      let updatedContent = { ...initialBannerContent };

      // Load from cookies
      Object.keys(initialBannerContent).forEach((key) => {
        const cookieValue = getCookie(`${COOKIE_PREFIX}${key}`);
        if (cookieValue) {
          updatedContent[key as keyof BannerContent] = cookieValue;
        }
      });

      // If there's content in localStorage, merge it with cookie values
      if (savedContent) {
        const parsedContent = JSON.parse(savedContent);
        updatedContent = {
          ...updatedContent,
          ...parsedContent
        };
      }

      setBannerContent(updatedContent);

      toast({
        title: "Conteúdo carregado",
        description: "Seu conteúdo anterior foi recuperado com sucesso",
        duration: 2000,
      });
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
      
      // Save field to cookie
      setCookie(`${COOKIE_PREFIX}${field}`, data);
      
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
    initialBannerContent,
    STORAGE_KEY,
  };
};