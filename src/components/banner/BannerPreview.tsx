import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BannerPreviewProps {
  content: any;
  onImageConfigChange: (imageId: string, config: any) => void;
}

const BannerPreview = ({ content, onImageConfigChange }: BannerPreviewProps) => {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const { toast } = useToast();

  const cleanLatexCommands = (text: string) => {
    return text
      ?.replace(/\\begin{.*?}|\\end{.*?}|\\columnbreak|\{[0-9]+\}/g, '')
      .replace(/\\textbf{(.*?)}/g, '$1')
      .replace(/\\vspace{.*?}/g, '')
      .replace(/\\Large/g, '')
      .replace(/\\noindent/g, '')
      .trim() || '';
  };

  useEffect(() => {
    const generatePreview = async () => {
      try {
        const processedAuthors = cleanLatexCommands(content.authors);
        const processedTitle = cleanLatexCommands(content.title);
        const processedInstitution = cleanLatexCommands(content.institution);

        const latexContent = `
\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[portuguese]{babel}
\\usepackage{geometry}
\\usepackage{multicol}
\\usepackage{graphicx}
\\usepackage{setspace}
\\usepackage{indentfirst}

\\geometry{
  a4paper,
  left=3cm,
  right=2cm,
  top=3cm,
  bottom=2cm
}

\\setlength{\\parindent}{1.25cm}
\\onehalfspacing

\\begin{document}

% Institution Logo and Name
\\begin{center}
${content.institutionLogo ? `\\includegraphics[width=0.3\\textwidth]{${content.institutionLogo}}` : ''}
\\vspace{0.5cm}

{\\large\\textbf{${processedInstitution}}}
\\end{center}

\\vspace{2cm}

% Title
\\begin{center}
{\\Large\\textbf{${processedTitle}}}
\\end{center}

\\vspace{2cm}

% Authors
\\begin{center}
${processedAuthors.split('\n').join('\\\\[0.5cm]\n')}
\\end{center}

\\vspace{2cm}

\\begin{multicols}{2}
\\noindent\\textbf{1. INTRODUÇÃO}
\\vspace{0.3cm}

${cleanLatexCommands(content.introduction)}

\\vspace{1cm}
\\noindent\\textbf{2. OBJETIVOS}
\\vspace{0.3cm}

${cleanLatexCommands(content.objectives)}

\\vspace{1cm}
\\noindent\\textbf{3. METODOLOGIA}
\\vspace{0.3cm}

${cleanLatexCommands(content.methodology)}

\\vspace{1cm}
\\noindent\\textbf{4. RESULTADOS E DISCUSSÃO}
\\vspace{0.3cm}

${cleanLatexCommands(content.results)}

\\vspace{1cm}
\\noindent\\textbf{5. CONCLUSÃO}
\\vspace{0.3cm}

${cleanLatexCommands(content.conclusion)}

\\vspace{1cm}
\\noindent\\textbf{6. REFERÊNCIAS}
\\vspace{0.3cm}

${cleanLatexCommands(content.references)}

\\vspace{1cm}
\\noindent\\textbf{AGRADECIMENTOS}
\\vspace{0.3cm}

${cleanLatexCommands(content.acknowledgments)}

\\end{multicols}
\\end{document}
`;

        const { data, error } = await supabase.functions.invoke('process-latex', {
          body: { latex: latexContent }
        });

        if (error) throw error;
        
        if (data?.html) {
          const cleanHtml = cleanLatexCommands(data.html);
          setPreviewHtml(cleanHtml);
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
    <Card className="p-4 h-full max-h-[85vh] bg-white">
      <div className="relative w-full" style={{ paddingTop: '141.4%' }}> {/* A4 aspect ratio (1:√2) */}
        <div 
          className="absolute top-0 left-0 w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 transition-colors"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgb(209 213 219) transparent',
          }}
        >
          <div className="mx-auto max-w-[210mm] h-[297mm] bg-white shadow-lg p-[30mm_20mm_20mm_30mm]">
            <div 
              dangerouslySetInnerHTML={{ __html: previewHtml }} 
              className="prose max-w-none"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BannerPreview;