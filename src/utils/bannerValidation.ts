import { toast } from "@/components/ui/use-toast";
import { countTextLines } from "./lineCounter";
import { BannerContent } from '@/components/banner/useBannerContent';

interface ValidationSection {
  name: string;
  content: string;
  min: number;
  max: number;
}

export const validateBannerContent = (bannerContent: BannerContent): boolean => {
  const sections: ValidationSection[] = [
    { name: 'Instituição', content: bannerContent.institution, min: 2, max: 3 },
    { name: 'Autores', content: bannerContent.authors, min: 2, max: 3 },
    { name: 'Introdução', content: bannerContent.introduction, min: 7, max: 10 },
    { name: 'Objetivos', content: bannerContent.objectives, min: 3, max: 4 },
    { name: 'Metodologia', content: bannerContent.methodology, min: 6, max: 8 },
    { name: 'Resultados', content: bannerContent.results, min: 5, max: 7 },
    { name: 'Conclusão', content: bannerContent.conclusion, min: 4, max: 6 },
    { name: 'Referências', content: bannerContent.references, min: 2, max: 3 },
  ];

  for (const section of sections) {
    const lineCount = countTextLines(section.content, { columns: 2 });
    console.log(`Seção ${section.name}: ${lineCount} linhas (em duas colunas)`);
    
    if (lineCount < section.min) {
      toast({
        title: "Conteúdo insuficiente",
        description: `A seção "${section.name}" precisa ter no mínimo ${section.min} linhas. Atualmente tem ${lineCount} linhas em duas colunas.`,
        variant: "destructive",
        duration: 5000,
      });
      return false;
    }
    
    if (lineCount > section.max) {
      toast({
        title: "Conteúdo excede o limite",
        description: `A seção "${section.name}" deve ter no máximo ${section.max} linhas. Atualmente tem ${lineCount} linhas em duas colunas.`,
        variant: "destructive",
        duration: 5000,
      });
      return false;
    }
  }
  return true;
};