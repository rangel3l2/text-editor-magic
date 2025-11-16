import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateLatexContent } from '@/utils/latexProcessor';
import BannerPreviewContent from './BannerPreviewContent';

interface BannerPreviewProps {
  content: any;
  onImageConfigChange: (imageId: string, config: any) => void;
}

const BannerPreview = ({ content, onImageConfigChange }: BannerPreviewProps) => {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const generatePreview = async () => {
      try {
        const html = generateLatexContent(content);
        setPreviewHtml(html);
      } catch (error) {
        console.error('Error generating preview:', error);
        toast({
          title: "Erro na previsão",
          description: "Não foi possível gerar a previsão do banner",
          variant: "destructive",
          duration: 3000,
        });
      }
    };

    generatePreview();
  }, [content, toast]);

  return (
    <Card className="w-full h-full bg-white overflow-auto">
      <BannerPreviewContent 
        previewHtml={previewHtml} 
        columnLayout={content.columnLayout || '2'}
        institutionLogo={content.institutionLogo}
        institutionName={content.institution}
        logoConfig={content.logoConfig}
      />
    </Card>
  );
};

export default BannerPreview;