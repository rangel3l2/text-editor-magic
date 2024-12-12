import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
        // Convert content object to LaTeX string
        const latexContent = `
\\documentclass{article}
\\begin{document}
\\title{${content.title || ''}}
\\author{${content.authors || ''}}
\\maketitle

\\section{Introduction}
${content.introduction || ''}

\\section{Objectives}
${content.objectives || ''}

\\section{Methodology}
${content.methodology || ''}

\\section{Results}
${content.results || ''}

\\section{Conclusion}
${content.conclusion || ''}

\\section{References}
${content.references || ''}

\\section*{Acknowledgments}
${content.acknowledgments || ''}
\\end{document}
`;

        const { data, error } = await supabase.functions.invoke('process-latex', {
          body: { latexContent }
        });

        if (error) throw error;
        setPreviewHtml(data.html);
      } catch (error) {
        console.error('Error generating preview:', error);
        toast({
          title: "Erro na previsão",
          description: "Não foi possível gerar a previsão do banner",
          variant: "destructive",
        });
      }
    };

    generatePreview();
  }, [content, toast]);

  return (
    <Card className="p-4">
      <AspectRatio ratio={16/9}>
        <div 
          className="w-full h-full bg-white rounded-lg shadow-inner overflow-auto"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </AspectRatio>
    </Card>
  );
};

export default BannerPreview;