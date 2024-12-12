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
        const latexContent = `
\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[portuguese]{babel}
\\usepackage{geometry}
\\geometry{
  a4paper,
  total={170mm,257mm},
  left=20mm,
  top=20mm,
}

\\begin{document}

\\begin{center}
\\Large\\textbf{${content.title || ''}}

\\vspace{0.5cm}
\\normalsize
${content.authors || ''}
\\end{center}

\\vspace{1cm}
\\section*{Introdução}
${content.introduction || ''}

\\vspace{0.5cm}
\\section*{Objetivos}
${content.objectives || ''}

\\vspace{0.5cm}
\\section*{Metodologia}
${content.methodology || ''}

\\vspace{0.5cm}
\\section*{Resultados e Discussão}
${content.results || ''}

\\vspace{0.5cm}
\\section*{Conclusão}
${content.conclusion || ''}

\\vspace{0.5cm}
\\section*{Referências}
${content.references || ''}

\\vspace{0.5cm}
\\section*{Agradecimentos}
${content.acknowledgments || ''}

\\end{document}
`;

        const { data, error } = await supabase.functions.invoke('process-latex', {
          body: { latex: latexContent }
        });

        if (error) throw error;
        
        if (data?.html) {
          setPreviewHtml(data.html);
        } else {
          throw new Error('No HTML content received from LaTeX processing');
        }
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
    <Card className="p-4">
      <AspectRatio ratio={16/9}>
        <div 
          className="w-full h-full bg-white rounded-lg shadow-inner overflow-auto p-4"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </AspectRatio>
    </Card>
  );
};

export default BannerPreview;