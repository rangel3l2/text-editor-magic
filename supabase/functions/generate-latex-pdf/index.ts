import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate LaTeX document for science fair banner (90cm x 120cm)
const generateLatexDocument = (content: any): string => {
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
  const authors = cleanLatex(content.authors || '');
  const advisors = cleanLatex(content.advisors || '');
  const institution = cleanLatex(content.institution || '');
  const introduction = cleanLatex(content.introduction || '');
  const objectives = cleanLatex(content.objectives || '');
  const methodology = cleanLatex(content.methodology || '');
  const results = cleanLatex(content.results || '');
  const conclusion = cleanLatex(content.conclusion || '');
  const references = cleanLatex(content.references || '');
  const acknowledgments = cleanLatex(content.acknowledgments || '');

  return `\\documentclass[a0paper,landscape]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[brazilian]{babel}
\\usepackage{geometry}
\\usepackage{multicol}
\\usepackage{graphicx}
\\usepackage{xcolor}
\\usepackage{titlesec}
\\usepackage{ragged2e}

% Banner dimensions: 90cm x 120cm (900mm x 1200mm)
\\geometry{
  paperwidth=120cm,
  paperheight=90cm,
  margin=2cm,
  top=2cm,
  bottom=2cm,
  left=2cm,
  right=2cm
}

% Define colors
\\definecolor{primaryblue}{RGB}{30,64,175}
\\definecolor{lightblue}{RGB}{59,130,246}
\\definecolor{bglight}{RGB}{240,249,255}

% Section styling
\\titleformat{\\section}
  {\\normalfont\\fontsize{32}{38}\\bfseries\\color{primaryblue}}
  {}{0em}{}[\\color{lightblue}\\titlerule[4pt]]

\\setlength{\\columnsep}{3cm}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{1em}

\\begin{document}
\\pagestyle{empty}

% Header section with institution
\\begin{center}
\\colorbox{bglight}{\\parbox{\\dimexpr\\textwidth-2\\fboxsep\\relax}{
  \\vspace{1cm}
  \\begin{minipage}{0.3\\textwidth}
    % Logo placeholder (if institutionLogo provided)
  \\end{minipage}
  \\hfill
  \\begin{minipage}{0.65\\textwidth}
    \\raggedleft
    \\fontsize{36}{43}\\selectfont\\textbf{${institution}}
  \\end{minipage}
  \\vspace{1cm}
}}
\\end{center}

\\vspace{2cm}

% Title and authors
\\begin{center}
  {\\fontsize{52}{62}\\selectfont\\textbf{\\color{primaryblue}${title}}}
  
  \\vspace{1.5cm}
  
  {\\fontsize{28}{34}\\selectfont ${authors}}
  
  ${advisors ? `\\vspace{0.8cm}\n  {\\fontsize{28}{34}\\selectfont\\textbf{Orientador(a): ${advisors}}}` : ''}
\\end{center}

\\vspace{2cm}

% Content in 2 columns
\\begin{multicols}{2}
\\fontsize{24}{29}\\selectfont
\\justifying

${introduction ? `\\section*{INTRODUÇÃO}\n${introduction}\n` : ''}

${objectives ? `\\section*{OBJETIVOS}\n${objectives}\n` : ''}

${methodology ? `\\section*{METODOLOGIA}\n${methodology}\n` : ''}

${results ? `\\section*{RESULTADOS E DISCUSSÃO}\n${results}\n` : ''}

${conclusion ? `\\section*{CONCLUSÃO}\n${conclusion}\n` : ''}

${references ? `\\section*{REFERÊNCIAS}\n${references}\n` : ''}

${acknowledgments ? `\\section*{AGRADECIMENTOS}\n${acknowledgments}\n` : ''}

\\end{multicols}

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

    console.log('Generating LaTeX document for banner:', content);

    // Generate LaTeX source
    const latexSource = generateLatexDocument(content);
    
    console.log('LaTeX source generated, length:', latexSource.length);

    // For now, return the LaTeX source
    // In production, this would be compiled to PDF using a LaTeX engine
    return new Response(
      JSON.stringify({ 
        latex: latexSource,
        message: 'LaTeX source generated. In production, this would be compiled to PDF.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate PDF' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})