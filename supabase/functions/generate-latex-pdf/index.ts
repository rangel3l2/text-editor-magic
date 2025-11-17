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

  let latexSource = '';

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
    latexSource = generateLatexDocument(content);
    
    console.log('LaTeX source generated, length:', latexSource.length);

    // Try LaTeX.Online (GET) first
    const latexOnlineUrl = 'https://latexonline.cc/compile?command=pdflatex&text=' + encodeURIComponent(latexSource);
    const latexOnlineResp = await fetch(latexOnlineUrl, { method: 'GET' });

    if (latexOnlineResp.ok && (latexOnlineResp.headers.get('content-type') || '').includes('application/pdf')) {
      const pdfBuffer = await latexOnlineResp.arrayBuffer();
      const base64Pdf = btoa(new Uint8Array(pdfBuffer).reduce((d, b) => d + String.fromCharCode(b), ''));
      console.log('PDF generated via latexonline.cc, size:', pdfBuffer.byteLength);
      return new Response(JSON.stringify({ pdf: base64Pdf, message: 'PDF generated successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      console.error('latexonline.cc failed or returned non-PDF. Status:', latexOnlineResp.status, 'CT:', latexOnlineResp.headers.get('content-type'));
    }

    // Fallback: Compile via texlive.net API
    const formData = new FormData();
    const latexWithCRLF = latexSource.replace(/\n/g, '\r\n');
    const texFile = new File([latexWithCRLF], 'document.tex', { type: 'application/x-tex' });
    formData.append('filecontents[]', texFile, 'document.tex');
    formData.append('filename[]', 'document.tex');
    formData.append('engine', 'xelatex');
    formData.append('return', 'pdf');

    const compileResponse = await fetch('https://texlive.net/cgi-bin/latexcgi', {
      method: 'POST',
      body: formData,
      redirect: 'manual',
    });

    if (compileResponse.status === 200) {
      const ct = compileResponse.headers.get('content-type') || '';
      if (ct.includes('application/pdf')) {
        const pdfBuffer = await compileResponse.arrayBuffer();
        const base64Pdf = btoa(new Uint8Array(pdfBuffer).reduce((d, b) => d + String.fromCharCode(b), ''));
        console.log('PDF generated via texlive.net (direct), size:', pdfBuffer.byteLength);
        return new Response(JSON.stringify({ pdf: base64Pdf, message: 'PDF generated successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    if (compileResponse.status !== 301 && compileResponse.status !== 302 && compileResponse.status !== 303) {
      const bodyText = await compileResponse.text().catch(() => '[no-body]');
      console.error('texlive.net failed:', compileResponse.status, bodyText);
      throw new Error('Failed to compile LaTeX to PDF');
    }

    const location = compileResponse.headers.get('Location');
    if (!location) {
      throw new Error('No PDF URL returned from compilation');
    }
    // texlive.net retorna a URL do .log, mas o PDF está no mesmo caminho com .pdf
    let pdfUrl = location.startsWith('http') ? location : `https://texlive.net${location}`;
    pdfUrl = pdfUrl.replace(/\.log$/, '.pdf'); // Trocar .log por .pdf
    console.log('PDF URL:', pdfUrl);

    const pdfResponse = await fetch(pdfUrl, { redirect: 'follow' });
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download compiled PDF: ${pdfResponse.status}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const base64Pdf = btoa(new Uint8Array(pdfBuffer).reduce((d, b) => d + String.fromCharCode(b), ''));
    console.log('PDF generated via texlive.net, size:', pdfBuffer.byteLength);

    return new Response(JSON.stringify({ pdf: base64Pdf, message: 'PDF generated successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        compiled: false,
        latex: latexSource || null,
        message: 'Compilation failed; returning LaTeX source for client-side compilation.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})