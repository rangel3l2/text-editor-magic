import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate LaTeX document for academic article (ABNT/IFMS format)
const generateArticleLatex = (content: any): string => {
  const cleanLatex = (text: string) => {
    if (!text) return '';
    return text
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/_/g, '\\_')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}')
      .replace(/<[^>]*>/g, ''); // Remove HTML tags
  };

  const title = cleanLatex(content.title || '');
  const subtitle = cleanLatex(content.subtitle || '');
  const authors = cleanLatex(content.authors || '');
  const advisors = cleanLatex(content.advisors || '');
  const abstract = cleanLatex(content.abstract || '');
  const keywords = cleanLatex(content.keywords || '');
  const englishAbstract = cleanLatex(content.englishAbstract || '');
  const englishKeywords = cleanLatex(content.englishKeywords || '');
  const introduction = cleanLatex(content.introduction || '');
  const methodology = cleanLatex(content.methodology || '');
  const results = cleanLatex(content.results || '');
  const conclusion = cleanLatex(content.conclusion || '');
  const references = cleanLatex(content.references || '');

  // Process theoretical topics
  const theoreticalSections = (content.theoreticalTopics || [])
    .map((topic: any, index: number) => {
      const topicTitle = cleanLatex(topic.title || '');
      const topicContent = cleanLatex(topic.content || '');
      return `\\section{${topicTitle.toUpperCase()}}\n${topicContent}\n`;
    })
    .join('\n');

  return `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[brazilian]{babel}
\\usepackage{geometry}
\\usepackage{indentfirst}
\\usepackage{setspace}
\\usepackage{times}
\\usepackage{ragged2e}

% Margens ABNT/IFMS: superior 3cm, direita 2cm, inferior 2cm, esquerda 3cm
\\geometry{
  a4paper,
  top=3cm,
  right=2cm,
  bottom=2cm,
  left=3cm
}

% Espaçamento entre linhas 1,5
\\setstretch{1.5}

% Recuo de parágrafo
\\setlength{\\parindent}{1.25cm}

% Configuração de cabeçalho e rodapé
\\usepackage{fancyhdr}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[R]{\\thepage}
\\renewcommand{\\headrulewidth}{0pt}

% Configuração de seções
\\usepackage{titlesec}
\\titleformat{\\section}
  {\\normalfont\\fontsize{12}{15}\\bfseries}
  {\\thesection}{1em}{}
\\titleformat{\\subsection}
  {\\normalfont\\fontsize{12}{15}\\bfseries}
  {\\thesubsection}{1em}{}

\\begin{document}

% Remove numeração da primeira página
\\thispagestyle{empty}

% Título
\\begin{center}
\\textbf{\\MakeUppercase{${title}}}${subtitle ? `\\\\\n${subtitle}` : ''}
\\end{center}

\\vspace{1cm}

% Autores e Orientadores
\\begin{center}
${authors}${advisors ? `\\\\\n\\vspace{0.5cm}\n${advisors}` : ''}
\\end{center}

\\vspace{1cm}

% Resumo
\\begin{flushleft}
\\textbf{RESUMO}
\\end{flushleft}

\\begin{justify}
${abstract}

\\textbf{Palavras-chave:} ${keywords}
\\end{justify}

\\vspace{1cm}

% Abstract
\\begin{flushleft}
\\textbf{ABSTRACT}
\\end{flushleft}

\\begin{justify}
${englishAbstract}

\\textbf{Keywords:} ${englishKeywords}
\\end{justify}

\\newpage
\\setcounter{page}{1}

% Introdução
\\section{INTRODUÇÃO}
\\begin{justify}
${introduction}
\\end{justify}

% Referencial Teórico
${theoreticalSections}

% Metodologia
\\section{METODOLOGIA}
\\begin{justify}
${methodology}
\\end{justify}

% Resultados e Discussão
\\section{RESULTADOS E DISCUSSÃO}
\\begin{justify}
${results}
\\end{justify}

% Conclusão
\\section{CONCLUSÃO}
\\begin{justify}
${conclusion}
\\end{justify}

% Referências (alinhadas à esquerda, espaçamento simples)
\\newpage
\\begin{flushleft}
\\textbf{REFERÊNCIAS}
\\end{flushleft}

\\begin{spacing}{1}
\\begin{flushleft}
${references}
\\end{flushleft}
\\end{spacing}

\\end{document}`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content } = await req.json()
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Generating LaTeX for article:', content);

    const latexSource = generateArticleLatex(content);
    
    console.log('LaTeX source generated, length:', latexSource.length);

    return new Response(
      JSON.stringify({ 
        latex: latexSource,
        message: 'LaTeX source generated for article with ABNT/IFMS formatting'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate LaTeX' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})