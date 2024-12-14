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
    if (!text) return '';
    
    return text
      // Remove LaTeX document structure commands
      .replace(/\\documentclass.*?\\begin{document}/s, '')
      .replace(/\\end{document}/, '')
      .replace(/\\usepackage.*?\n/g, '')
      .replace(/\\geometry{.*?}/s, '')
      
      // Remove specific LaTeX formatting commands
      .replace(/\\large/g, '')
      .replace(/\\Large/g, '')
      .replace(/\\textbf{([^}]*)}/g, '$1')
      .replace(/\\textit{([^}]*)}/g, '$1')
      .replace(/\\begin{center}([\s\S]*?)\\end{center}/g, '$1')
      .replace(/\\begin{flushleft}([\s\S]*?)\\end{flushleft}/g, '$1')
      .replace(/\\vspace{[^}]+}/g, '')
      .replace(/\\noindent/g, '')
      .replace(/\\columnbreak/g, '')
      .replace(/\\{|\\}/g, '')
      .replace(/\{|\}/g, '')
      .trim();
  };

  useEffect(() => {
    const generatePreview = async () => {
      try {
        const processedAuthors = cleanLatexCommands(content.authors);
        const processedTitle = cleanLatexCommands(content.title);
        const processedInstitution = cleanLatexCommands(content.institution);

        let latexContent = '\\documentclass[12pt,a4paper]{article}\n';
        latexContent += '\\usepackage[utf8]{inputenc}\n';
        latexContent += '\\usepackage[portuguese]{babel}\n';
        latexContent += '\\usepackage{geometry}\n';
        latexContent += '\\usepackage{multicol}\n';
        latexContent += '\\usepackage{graphicx}\n';
        latexContent += '\\usepackage{setspace}\n';
        latexContent += '\\usepackage{indentfirst}\n\n';

        latexContent += '\\geometry{\n';
        latexContent += '  a4paper,\n';
        latexContent += '  left=3cm,\n';
        latexContent += '  right=2cm,\n';
        latexContent += '  top=3cm,\n';
        latexContent += '  bottom=2cm\n';
        latexContent += '}\n\n';

        latexContent += '\\setlength{\\parindent}{1.25cm}\n';
        latexContent += '\\onehalfspacing\n\n';
        latexContent += '\\begin{document}\n\n';

        // Institution Logo and Name
        if (content.institutionLogo || processedInstitution) {
          latexContent += '\\begin{center}\n';
          if (content.institutionLogo) {
            latexContent += `\\includegraphics[width=0.3\\textwidth]{${content.institutionLogo}}\n`;
            latexContent += '\\vspace{0.5cm}\n\n';
          }
          if (processedInstitution) {
            latexContent += `{\\large ${processedInstitution}}\n`;
          }
          latexContent += '\\end{center}\n\n';
          latexContent += '\\vspace{2cm}\n\n';
        }

        // Title
        if (processedTitle) {
          latexContent += '\\begin{center}\n';
          latexContent += `{\\Large ${processedTitle}}\n`;
          latexContent += '\\end{center}\n\n';
          latexContent += '\\vspace{2cm}\n\n';
        }

        // Authors
        if (processedAuthors) {
          latexContent += '\\begin{center}\n';
          latexContent += processedAuthors.split('\n').join('\\\\[0.5cm]\n');
          latexContent += '\\end{center}\n\n';
          latexContent += '\\vspace{2cm}\n\n';
        }

        // Content sections
        if (content.introduction || content.objectives || content.methodology || 
            content.results || content.conclusion || content.references || content.acknowledgments) {
          latexContent += '\\begin{multicols}{2}\n';

          // Introduction
          if (content.introduction) {
            latexContent += '\\noindent\\textbf{1. INTRODUÇÃO}\n';
            latexContent += '\\vspace{0.3cm}\n\n';
            latexContent += `${cleanLatexCommands(content.introduction)}\n\n`;
            latexContent += '\\vspace{1cm}\n';
          }

          // Objectives
          if (content.objectives) {
            latexContent += '\\noindent\\textbf{2. OBJETIVOS}\n';
            latexContent += '\\vspace{0.3cm}\n\n';
            latexContent += `${cleanLatexCommands(content.objectives)}\n\n`;
            latexContent += '\\vspace{1cm}\n';
          }

          // Methodology
          if (content.methodology) {
            latexContent += '\\noindent\\textbf{3. METODOLOGIA}\n';
            latexContent += '\\vspace{0.3cm}\n\n';
            latexContent += `${cleanLatexCommands(content.methodology)}\n\n`;
            latexContent += '\\vspace{1cm}\n';
          }

          // Results
          if (content.results) {
            latexContent += '\\noindent\\textbf{4. RESULTADOS E DISCUSSÃO}\n';
            latexContent += '\\vspace{0.3cm}\n\n';
            latexContent += `${cleanLatexCommands(content.results)}\n\n`;
            latexContent += '\\vspace{1cm}\n';
          }

          // Conclusion
          if (content.conclusion) {
            latexContent += '\\noindent\\textbf{5. CONCLUSÃO}\n';
            latexContent += '\\vspace{0.3cm}\n\n';
            latexContent += `${cleanLatexCommands(content.conclusion)}\n\n`;
            latexContent += '\\vspace{1cm}\n';
          }

          // References
          if (content.references) {
            latexContent += '\\noindent\\textbf{6. REFERÊNCIAS}\n';
            latexContent += '\\vspace{0.3cm}\n\n';
            latexContent += `${cleanLatexCommands(content.references)}\n\n`;
            latexContent += '\\vspace{1cm}\n';
          }

          // Acknowledgments
          if (content.acknowledgments) {
            latexContent += '\\noindent\\textbf{AGRADECIMENTOS}\n';
            latexContent += '\\vspace{0.3cm}\n\n';
            latexContent += `${cleanLatexCommands(content.acknowledgments)}\n\n`;
          }

          latexContent += '\\end{multicols}\n';
        }

        latexContent += '\\end{document}';

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
    <Card className="w-full h-full bg-white overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div 
          className="w-[210mm] h-[297mm] bg-white shadow-lg rounded-sm overflow-hidden flex-shrink-0 transform scale-[0.75] origin-center"
          style={{
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="p-[30mm_20mm_20mm_30mm]">
              <div 
                dangerouslySetInnerHTML={{ __html: previewHtml }} 
                className="prose max-w-none"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BannerPreview;