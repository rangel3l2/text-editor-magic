import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Gerar documento LaTeX para artigo científico ABNT
const generateArticleLatex = (content: any): string => {
  const cleanLatex = (text: string) => {
    if (!text) return '';
    
    return text
      // Converter tags HTML de parágrafo em quebras de parágrafo LaTeX
      .replace(/<\/p>\s*<p>/gi, '\n\n')
      .replace(/<p>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '\\textbf{$1}')
      .replace(/<em>(.*?)<\/em>/gi, '\\textit{$1}')
      .replace(/<ul>/gi, '\\begin{itemize}\n')
      .replace(/<\/ul>/gi, '\\end{itemize}\n')
      .replace(/<ol>/gi, '\\begin{enumerate}\n')
      .replace(/<\/ol>/gi, '\\end{enumerate}\n')
      .replace(/<li>(.*?)<\/li>/gi, '\\item $1\n')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '\\&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/<[^>]+>/g, '')
      .replace(/[%$#_{}]/g, (match) => `\\${match}`)
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}')
      // Remove quebras de linha múltiplas (mais de 2)
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();
  };

let latex = `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[portuguese]{babel}
\\usepackage[T1]{fontenc}
\\usepackage{mathptmx}
\\usepackage{url}
\\usepackage{indentfirst}
\\usepackage{geometry}
\\usepackage{setspace}
\\usepackage{titlesec}
\\usepackage{enumitem}

% Configurações ABNT
\\geometry{
  a4paper,
  left=3cm,
  right=2cm,
  top=3cm,
  bottom=2cm
}

% Espaçamento 1.5
\\onehalfspacing

% Recuo de parágrafo 1.25cm (ABNT)
\\setlength{\\parindent}{1.25cm}

% Espaçamento entre parágrafos (ABNT - sem espaço adicional)
\\setlength{\\parskip}{0pt}

% Formatação de seções (ABNT)
\\titleformat{\\section}{\\normalfont\\fontsize{12}{15}\\bfseries\\MakeUppercase}{\\thesection}{1em}{}
\\titleformat{\\subsection}{\\normalfont\\fontsize{12}{15}\\bfseries}{\\thesubsection}{1em}{}

% Ambiente para citações longas (>3 linhas) - ABNT
\\newenvironment{citacao}{%
  \\vspace{0.5cm}%
  \\begin{singlespacing}%
  \\footnotesize%
  \\setlength{\\leftskip}{4cm}%
  \\setlength{\\parindent}{0cm}%
}{%
  \\end{singlespacing}%
  \\vspace{0.5cm}%
}

\\begin{document}

% Capa
\\begin{center}
\\MakeUppercase{\\textbf{${cleanLatex(content.institution || 'INSTITUTO FEDERAL')}}}

\\vspace{3cm}

\\MakeUppercase{\\textbf{${cleanLatex(content.title)}}}

${content.subtitle ? `\\vspace{0.5cm}\n\n${cleanLatex(content.subtitle)}` : ''}

\\vfill

${cleanLatex(content.authors || '')}

\\vfill

${new Date().getFullYear()}
\\end{center}

\\clearpage

% Resumo
\\section*{RESUMO}

\\noindent ${cleanLatex(content.abstract)}

\\noindent \\textbf{Palavras-chave:} ${cleanLatex(content.keywords)}

\\vspace{1cm}

% Abstract
\\section*{ABSTRACT}

\\noindent ${cleanLatex(content.englishAbstract)}

\\noindent \\textbf{Keywords:} ${cleanLatex(content.englishKeywords)}

\\clearpage

% Introdução
\\section{INTRODUÇÃO}
${cleanLatex(content.introduction)}

`;

  // Referencial teórico
  if (content.theoreticalTopics && content.theoreticalTopics.length > 0) {
    content.theoreticalTopics.forEach((topic: any) => {
      latex += `\\section{${cleanLatex(topic.title).toUpperCase()}}\n${cleanLatex(topic.content)}\n\n`;
    });
  }

  // Metodologia
  const methSection = 2 + (content.theoreticalTopics?.length || 0);
  latex += `\\section{METODOLOGIA}\n${cleanLatex(content.methodology)}\n\n`;

  // Resultados
  latex += `\\section{RESULTADOS E DISCUSSÃO}\n${cleanLatex(content.results)}\n\n`;

  // Conclusão
  latex += `\\section{CONCLUSÃO}\n${cleanLatex(content.conclusion)}\n\n`;

  // Referências
  latex += `\\clearpage

\\section*{REFERÊNCIAS}

\\begin{singlespacing}
\\raggedright
${cleanLatex(content.references)}
\\end{singlespacing}

\\end{document}`;

  return latex;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    if (!content || !content.title) {
      return new Response(
        JSON.stringify({ error: "Título é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Gerando artigo LaTeX para:', content.title);

    const latexSource = generateArticleLatex(content);
    
    console.log('LaTeX gerado, tamanho:', latexSource.length);

    // Retornar LaTeX gerado (em produção, compilaria para PDF)
    return new Response(
      JSON.stringify({ 
        latex: latexSource,
        message: 'Código LaTeX gerado com sucesso. Para visualizar o PDF, copie o código e cole em um editor LaTeX online como Overleaf.'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Erro ao gerar artigo:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
