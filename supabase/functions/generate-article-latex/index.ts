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
      .replace(/<b>(.*?)<\/b>/gi, '\\textbf{$1}')
      .replace(/<em>(.*?)<\/em>/gi, '\\textit{$1}')
      .replace(/<i>(.*?)<\/i>/gi, '\\textit{$1}')
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
      // Normalizar quebras de linha: max 2 consecutivas (ABNT não usa espaços extras)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };
  
  // Função específica para formatar referências ABNT
  const formatReferences = (text: string) => {
    if (!text) return '';
    
    // Primeiro aplica cleanLatex para converter tags básicas
    let formatted = cleanLatex(text);
    
    // Processa cada linha de referência individualmente
    const lines = formatted.split('\n\n');
    const formattedLines = lines.map(line => {
      if (!line.trim()) return '';
      
      // Remove quebras de linha internas, mantendo tudo em uma linha
      line = line.replace(/\n/g, ' ').trim();
      
      // Adiciona espaço entre referências
      return line;
    }).filter(Boolean);
    
    // Junta com espaçamento simples entre referências
    return formattedLines.join('\n\n');
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
\\usepackage{graphicx}
\\usepackage{float}

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

% Toda seção numerada começa em nova página (padrão IFMS)
\\newcommand{\\sectionbreak}{\\clearpage}

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

% Capa (Página 1 - inclui título, autores e resumo)
\\begin{center}
\\MakeUppercase{\\textbf{${cleanLatex(content.institution || 'INSTITUTO FEDERAL')}}}

\\vspace{1.5cm}

\\MakeUppercase{\\textbf{${cleanLatex(content.title)}}}

${content.subtitle ? `\\vspace{0.3cm}\n\n${cleanLatex(content.subtitle)}` : ''}

\\vspace{1cm}

${cleanLatex(content.authors || '')}

\\vspace{0.5cm}

${new Date().getFullYear()}
\\end{center}

\\vspace{1cm}

% Resumo (ainda na página 1, sem section*)
\\noindent \\textbf{RESUMO}

\\vspace{0.5cm}

\\noindent ${cleanLatex(content.abstract)}

\\vspace{0.5cm}

\\noindent \\textbf{Palavras-chave:} ${cleanLatex(content.keywords)}

\\clearpage

% Abstract (Página 2)
\\noindent \\textbf{ABSTRACT}

\\vspace{0.5cm}

\\noindent ${cleanLatex(content.englishAbstract)}

\\vspace{0.5cm}

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
  
  // Imagens da metodologia
  if (content.images && content.images.length > 0) {
    latex += generateImageLatex(content.images, 'methodology');
  }

  // Resultados
  latex += `\\section{RESULTADOS E DISCUSSÃO}\n${cleanLatex(content.results)}\n\n`;
  
  // Imagens dos resultados
  if (content.images && content.images.length > 0) {
    latex += generateImageLatex(content.images, 'results');
  }

  // Conclusão
  latex += `\\section{CONCLUSÃO}\n${cleanLatex(content.conclusion)}\n\n`;
  
  // Imagens da conclusão
  if (content.images && content.images.length > 0) {
    latex += generateImageLatex(content.images, 'conclusion');
  }

  // Referências
  latex += `\\clearpage

\\section*{REFERÊNCIAS}

\\begin{singlespacing}
\\raggedright
${formatReferences(content.references)}
\\end{singlespacing}

\\end{document}`;

  return latex;
};

// Função para gerar LaTeX de imagens formatadas ABNT
const generateImageLatex = (images: any[], section: string): string => {
  const sectionImages = images.filter(img => img.section === section);
  if (sectionImages.length === 0) return '';
  
  return sectionImages.map((img, idx) => {
    const figureType = (img.type || 'figura').toUpperCase();
    const caption = img.caption || `${figureType} ${idx + 1}`;
    const source = img.source || 'Fonte: Documento original';
    
    return `
\\begin{figure}[H]
  \\centering
  \\includegraphics[width=0.8\\textwidth]{${img.url}}
  \\caption{${caption}}
  \\label{fig:${section}-${idx + 1}}
  \\textit{${source}}
\\end{figure}
`;
  }).join('\n');
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
