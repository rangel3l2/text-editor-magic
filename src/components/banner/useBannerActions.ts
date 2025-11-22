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
    try {
      const { data, error } = await supabase.functions.invoke('generate-latex-pdf', {
        body: { 
          content: {
            ...bannerContent,
            work_id: id,
            user_id: user?.id,
          }
        }
      });

      if (error) throw error;

      if (data?.pdf) {
        const binaryString = atob(data.pdf);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const pdfBlob = new Blob([bytes], { type: 'application/pdf' });
        const pdfUrl = window.URL.createObjectURL(pdfBlob);
        
        const pdfLink = document.createElement('a');
        pdfLink.href = pdfUrl;
        pdfLink.download = 'banner-academico.pdf';
        document.body.appendChild(pdfLink);
        pdfLink.click();
        document.body.removeChild(pdfLink);
        window.URL.revokeObjectURL(pdfUrl);
        
        toast({
          title: "PDF gerado",
          description: "PDF foi baixado com sucesso",
          duration: 3000,
        });
      } else {
        throw new Error('Erro ao gerar PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o documento. Tente novamente.",
        duration: 3000,
      });
    }
  };

  const handleGenerateLatex = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-latex-pdf', {
        body: { 
          content: {
            ...bannerContent,
            work_id: id,
            user_id: user?.id,
          }
        }
      });

      if (error) throw error;

      if (data?.zip) {
        const binaryString = atob(data.zip);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const zipBlob = new Blob([bytes], { type: 'application/zip' });
        const zipUrl = window.URL.createObjectURL(zipBlob);
        
        const zipLink = document.createElement('a');
        zipLink.href = zipUrl;
        zipLink.download = 'banner-latex-completo.zip';
        document.body.appendChild(zipLink);
        zipLink.click();
        document.body.removeChild(zipLink);
        window.URL.revokeObjectURL(zipUrl);
        
        toast({
          title: "LaTeX gerado",
          description: "ZIP com código LaTeX e imagens foi baixado",
          duration: 3000,
        });
      } else if (data?.latex) {
        const texBlob = new Blob([data.latex], { type: 'application/x-tex' });
        const url = window.URL.createObjectURL(texBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'banner.tex';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "LaTeX gerado",
          description: "Arquivo .tex foi baixado",
          duration: 3000,
        });
      } else {
        throw new Error('Erro ao gerar LaTeX');
      }
    } catch (error) {
      console.error('Error generating LaTeX:', error);
      toast({
        title: "Erro ao gerar LaTeX",
        description: "Ocorreu um erro ao gerar o arquivo. Tente novamente.",
        duration: 3000,
      });
    }
  };

  const handleShare = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-latex-pdf', {
        body: { 
          content: {
            ...bannerContent,
            work_id: id,
            user_id: user?.id,
          }
        }
      });

      if (error) throw error;

      // Preparar arquivos para compartilhar
      const files = [];

      // Adicionar ZIP se disponível
      if (data?.zip) {
        const zipBinaryString = atob(data.zip);
        const zipBytes = new Uint8Array(zipBinaryString.length);
        for (let i = 0; i < zipBinaryString.length; i++) {
          zipBytes[i] = zipBinaryString.charCodeAt(i);
        }
        const zipBlob = new Blob([zipBytes], { type: 'application/zip' });
        const zipFile = new File([zipBlob], 'banner-latex-completo.zip', { type: 'application/zip' });
        files.push(zipFile);
      }

      if (data?.pdf) {
        // Decodificar base64 usando API nativa do navegador
        const binaryString = atob(data.pdf);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const pdfBlob = new Blob([bytes], { type: 'application/pdf' });
        const pdfFile = new File([pdfBlob], 'banner-academico.pdf', { type: 'application/pdf' });
        files.push(pdfFile);

        if (navigator.share && navigator.canShare({ files })) {
          await navigator.share({
            files,
            title: 'Banner Acadêmico',
            text: 'Compartilhar banner acadêmico'
          });
          
          toast({
            title: "Compartilhamento iniciado",
            description: "Escolha como deseja compartilhar seu banner",
            duration: 3000,
          });
        } else {
          // Se não pode compartilhar, baixa os arquivos
          const pdfUrl = window.URL.createObjectURL(pdfBlob);
          const tempLink = document.createElement('a');
          tempLink.href = pdfUrl;
          tempLink.download = 'banner-academico.pdf';
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);
          window.URL.revokeObjectURL(pdfUrl);
          
          // Baixar ZIP se disponível
          if (data?.zip) {
            const zipBinaryString = atob(data.zip);
            const zipBytes = new Uint8Array(zipBinaryString.length);
            for (let i = 0; i < zipBinaryString.length; i++) {
              zipBytes[i] = zipBinaryString.charCodeAt(i);
            }
            const zipBlob = new Blob([zipBytes], { type: 'application/zip' });
            const zipUrl = window.URL.createObjectURL(zipBlob);
            const zipLink = document.createElement('a');
            zipLink.href = zipUrl;
            zipLink.download = 'banner-latex-completo.zip';
            document.body.appendChild(zipLink);
            zipLink.click();
            document.body.removeChild(zipLink);
            window.URL.revokeObjectURL(zipUrl);
          }
          
          toast({
            title: "Arquivos baixados",
            description: data?.zip ? "PDF e ZIP com LaTeX foram baixados" : "PDF foi baixado para seu computador",
            duration: 3000,
          });
        }
      } else if (data?.latex) {
        // Fallback: compartilhar/baixar o .tex quando a compilação falhar
        const texBlob = new Blob([data.latex], { type: 'application/x-tex' });
        const file = new File([texBlob], 'banner.tex', { type: 'application/x-tex' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'LaTeX do Banner',
            text: 'LaTeX gerado para compilação posterior'
          });
          toast({
            title: "LaTeX compartilhado",
            description: "A compilação falhou. Compartilhamos o .tex para você",
            duration: 3000,
          });
        } else {
          const url = window.URL.createObjectURL(texBlob);
          const tempLink = document.createElement('a');
          tempLink.href = url;
          tempLink.download = 'banner.tex';
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);
          window.URL.revokeObjectURL(url);

          toast({
            title: "LaTeX gerado",
            description: "Baixamos o .tex porque a compilação falhou agora",
            duration: 3000,
          });
        }
      } else {
        throw new Error('Resposta inesperada da função de geração de PDF');
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
    handleGenerateLatex,
    handleShare,
    handleClearFields
  };
};