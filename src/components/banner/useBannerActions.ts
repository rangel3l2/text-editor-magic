import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BannerContent } from './useBannerContent';
import { validateBannerContent } from '@/utils/bannerValidation';
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "react-router-dom";

export const useBannerActions = (
  bannerContent: BannerContent,
  setBannerContent: (content: BannerContent) => void,
  initialBannerContent: BannerContent,
) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { id } = useParams();

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

  const handleClearFields = () => {
    setBannerContent(initialBannerContent);
    toast({
      title: "Campos limpos",
      description: "Todos os campos foram limpos com sucesso",
      duration: 3000,
    });
  };

  return {
    handleGeneratePDF,
    handleShare,
    handleClearFields
  };
};