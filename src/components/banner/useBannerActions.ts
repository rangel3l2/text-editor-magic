import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BannerContent } from './useBannerContent';
import { validateBannerContent } from '@/utils/bannerValidation';

export const useBannerActions = (
  bannerContent: BannerContent,
  setBannerContent: (content: BannerContent) => void,
  initialBannerContent: BannerContent,
  STORAGE_KEY: string
) => {
  const { toast } = useToast();

  const handleGeneratePDF = async () => {
    if (!validateBannerContent(bannerContent)) {
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
    if (!validateBannerContent(bannerContent)) {
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
    toast({
      title: "Campos limpos",
      description: "Todos os campos foram limpos com sucesso",
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