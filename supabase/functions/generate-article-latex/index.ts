import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Gerar documento LaTeX para artigo científico ABNT/IFMS
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
      // Normalizar quebras de linha: max 2 consecutivas
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };
  
  // Função específica para formatar referências ABNT
  const formatReferences = (text: string) => {
    if (!text) return '';
    
    let formatted = cleanLatex(text);
    const lines = formatted.split('\n\n');
    const formattedLines = lines.map(line => {
      if (!line.trim()) return '';
      line = line.replace(/\n/g, ' ').trim();
      return line;
    }).filter(Boolean);
    
    return formattedLines.join('\n\n');
  };

const latex = `%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Modelo de Artigo Científico - Padrão IFMS / ABNT
% Gerado automaticamente pelo sistema de orientação virtual
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\documentclass[12pt,a4paper]{article}

% --- Pacotes Fundamentais ---
\\usepackage[utf8]{inputenc}
\\usepackage[portuguese]{babel}
\\usepackage[T1]{fontenc}
\\usepackage{mathptmx}      % Fonte Times New Roman (Padrão ABNT)
\\usepackage{url}
\\usepackage{indentfirst}   % Indenta o primeiro parágrafo de cada seção
\\usepackage{geometry}      % Configuração de margens
\\usepackage{setspace}      % Espaçamento entre linhas
\\usepackage{titlesec}      % Formatação de títulos de seções
\\usepackage{enumitem}      % Listas personalizadas
\\usepackage{graphicx}      % Inclusão de imagens
\\usepackage{float}         % Para posicionar figuras com [H]
\\usepackage{caption}       % Formatação das legendas
\\usepackage{microtype}     % Melhoria na justificação do texto

% --- Configurações de Layout (ABNT) ---
\\geometry{
  a4paper,
  left=3cm,
  right=2cm,
  top=3cm,
  bottom=2cm
}

% Espaçamento 1.5 no corpo do texto
\\onehalfspacing

% Recuo de parágrafo 1.25cm
\\setlength{\\parindent}{1.25cm}

% Espaçamento entre parágrafos (0pt, pois já usa recuo)
\\setlength{\\parskip}{0pt}

% --- Formatação de Títulos (Seções) ---
% Seção Primária: CAIXA ALTA, NEGRITO, tam 12
\\titleformat{\\section}
  {\\normalfont\\fontsize{12}{15}\\bfseries\\MakeUppercase}
  {\\thesection}{1em}{}

% Seção Secundária: Negrito, tam 12
\\titleformat{\\subsection}
  {\\normalfont\\fontsize{12}{15}\\bfseries}
  {\\thesubsection}{1em}{}

% Espaçamento antes e depois dos títulos
\\titlespacing*{\\section}{0pt}{1.5cm}{1.5cm}
\\titlespacing*{\\subsection}{0pt}{1.0cm}{1.0cm}

% --- Comando para "Fonte" em figuras/quadros ---
\\newcommand{\\fonte}[1]{
    \\vspace{-5pt}
    \\begin{center}
        \\small Fonte: #1
    \\end{center}
}

% --- Ambiente para Citações Longas (> 3 linhas) ---
\\newenvironment{citacao}{
  \\vspace{0.5cm}
  \\begin{singlespacing}
  \\small
  \\setlength{\\leftskip}{4cm} % Recuo de 4cm
  \\noindent
}{
  \\end{singlespacing}
  \\vspace{0.5cm}
}

% --- Início do Documento ---
\\begin{document}

% --- Cabeçalho / Capa Simplificada para Artigo ---
\\begin{center}
    % Cabeçalho Institucional
    \\textbf{\\MakeUppercase{${cleanLatex(content.institution || 'Instituto Federal de Educação, Ciência e Tecnologia de Mato Grosso do Sul')}}}
    \\vspace{1.5cm}

    % Título do Artigo
    \\textbf{\\MakeUppercase{${cleanLatex(content.title)}}}
    
    \\vspace{1cm}

    % Autores
    ${cleanLatex(content.authors || 'Autor\\footnote{Informações do autor}')}
    
    \\vspace{0.5cm}
    
    Três Lagoas - MS, ${new Date().getFullYear()}
\\end{center}

\\vspace{1cm}

% --- Resumo ---
\\noindent \\textbf{RESUMO}
\\vspace{0.5cm}

\\begin{singlespacing}
\\noindent ${cleanLatex(content.abstract)}

\\vspace{0.5cm}
\\noindent \\textbf{Palavras-chave:} ${cleanLatex(content.keywords)}
\\end{singlespacing}

\\vspace{1cm}

% --- Abstract ---
\\noindent \\textbf{ABSTRACT}
\\vspace{0.5cm}

\\begin{singlespacing}
\\noindent ${cleanLatex(content.englishAbstract)}

\\vspace{0.5cm}
\\noindent \\textbf{Keywords:} ${cleanLatex(content.englishKeywords)}
\\end{singlespacing}

\\clearpage

% --- Corpo do Texto ---

\\section{Introdução}
${cleanLatex(content.introduction)}

${
  content.theoreticalTopics && content.theoreticalTopics.length > 0
    ? content.theoreticalTopics.map((topic: any) => 
        `\\section{${cleanLatex(topic.title)}}\n${cleanLatex(topic.content)}\n`
      ).join('\n')
    : ''
}

\\section{Metodologia}
${cleanLatex(content.methodology)}

${content.images && content.images.length > 0 ? generateImageLatex(content.images, 'methodology') : ''}

\\section{Resultados e Discussão}
${cleanLatex(content.results)}

${content.images && content.images.length > 0 ? generateImageLatex(content.images, 'results') : ''}

\\section{Conclusão}
${cleanLatex(content.conclusion)}

${content.images && content.images.length > 0 ? generateImageLatex(content.images, 'conclusion') : ''}

\\clearpage

% --- Referências ---
\\section*{REFERÊNCIAS}
\\begin{singlespacing}
\\setlength{\\parskip}{1em}
\\noindent

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
    const figureType = (img.type || 'figura');
    const caption = img.caption || `${figureType.charAt(0).toUpperCase() + figureType.slice(1)} ${idx + 1}`;
    const source = img.source || 'Elaborado pelo autor';
    
    return `
\\begin{figure}[H]
    \\centering
    \\caption{${cleanLatex(caption)}}
    \\includegraphics[width=0.8\\textwidth]{${img.url}}
    \\fonte{${cleanLatex(source)}}
    \\label{fig:${section}-${idx + 1}}
\\end{figure}
`;
  }).join('\n');
};

const cleanLatex = (text: string) => {
  if (!text) return '';
  
  return text
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
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
