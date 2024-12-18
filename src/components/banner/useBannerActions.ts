import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BannerContent } from './useBannerContent';

const countLines = (content: string): number => {
  if (!content) return 0;
  
  // Remove HTML tags
  const textWithoutTags = content.replace(/<[^>]*>/g, '');
  
  // Split by line breaks and filter out empty lines
  const lines = textWithoutTags
    .split(/\r\n|\r|\n/)
    .filter(line => line.trim().length > 0);

  // Calculate additional lines based on character count per line
  const charsPerLine = 90; // Aproximadamente 90 caracteres por linha em fonte 12pt
  let totalLines = 0;

  lines.forEach(line => {
    const lineLength = line.trim().length;
    const additionalLines = Math.ceil(lineLength / charsPerLine);
    totalLines += additionalLines;
  });

  return totalLines;
};

export const useBannerActions = (
  bannerContent: BannerContent,
  setBannerContent: (content: BannerContent) => void,
  initialBannerContent: BannerContent,
  STORAGE_KEY: string
) => {
  const { toast } = useToast();

  const validateContent = () => {
    const sections = [
      { name: 'Autores e Instituição', content: bannerContent.authors + bannerContent.institution, min: 2, max: 3 },
      { name: 'Introdução', content: bannerContent.introduction, min: 7, max: 10 },
      { name: 'Objetivos', content: bannerContent.objectives, min: 3, max: 4 },
      { name: 'Metodologia', content: bannerContent.methodology, min: 6, max: 8 },
      { name: 'Resultados', content: bannerContent.results, min: 5, max: 7 },
      { name: 'Conclusão', content: bannerContent.conclusion, min: 4, max: 6 },
      { name: 'Referências', content: bannerContent.references, min: 2, max: 3 },
    ];

    for (const section of sections) {
      const lineCount = countLines(section.content);
      console.log(`Seção ${section.name}: ${lineCount} linhas`);
      
      if (lineCount < section.min) {
        toast({
          title: "Conteúdo insuficiente",
          description: `A seção "${section.name}" precisa ter no mínimo ${section.min} linhas. Atualmente tem ${lineCount} linhas.`,
          variant: "destructive",
          duration: 5000,
        });
        return false;
      }
      
      if (lineCount > section.max) {
        toast({
          title: "Conteúdo excede o limite",
          description: `A seção "${section.name}" deve ter no máximo ${section.max} linhas. Atualmente tem ${lineCount} linhas.`,
          variant: "destructive",
          duration: 5000,
        });
        return false;
      }
    }
    return true;
  };

  const handleGeneratePDF = async () => {
    if (!validateContent()) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-latex-pdf', {
        body: { content: bannerContent }
      });

      if (error) throw error;

      const pdfBlob = new Blob([Buffer.from(data.pdf, 'base64')], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'banner-academico.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "PDF gerado",
        description: "Seu banner acadêmico foi exportado com sucesso",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o documento. Tente novamente.",
        duration: 3000,
      });
    }
  };

  const handleShare = async () => {
    if (!validateContent()) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-latex-pdf', {
        body: { content: bannerContent }
      });

      if (error) throw error;

      const pdfBlob = new Blob([Buffer.from(data.pdf, 'base64')], { type: 'application/pdf' });
      const file = new File([pdfBlob], 'banner-academico.pdf', { type: 'application/pdf' });

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
        const url = window.URL.createObjectURL(pdfBlob);
        const tempLink = document.createElement('a');
        tempLink.href = url;
        tempLink.download = 'banner-academico.pdf';
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

  return {
    handleGeneratePDF,
    handleShare,
    handleLoadSavedContent,
    handleClearFields
  };
};