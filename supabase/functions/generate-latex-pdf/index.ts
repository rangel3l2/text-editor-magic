import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate LaTeX document for science fair banner (90cm x 120cm)
const generateLatexDocument = (content: any, images: any[] = []): string => {
  const cleanLatex = (text: string) => {
    if (!text) return '';
    // Remove placeholders de imagens
    let cleaned = text.replace(/\[\[placeholder:[^\]]+\]\]/g, '');
    // Remove HTML entities
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    cleaned = cleaned.replace(/&amp;/g, '\\&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&quot;/g, '"');
    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    // Escape LaTeX special characters
    return cleaned
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/_/g, '\\_')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}');
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

  // Gerar comandos para incluir imagens
  let imageCommands = '';
  if (images && images.length > 0) {
    imageCommands = '% Imagens disponíveis (URLs abaixo):\n';
    imageCommands += images.map((img, idx) => {
      const imageUrl = img.public_url || '';
      const filename = `image_${idx + 1}`;
      const caption = img.caption ? cleanLatex(img.caption) : '';
      const widthCm = img.width_cm || 8;
      
      return `% Imagem ${idx + 1}: ${imageUrl}
% Baixe esta imagem e salve como ${filename}.jpg na mesma pasta do .tex
\\begin{center}
  \\includegraphics[width=${widthCm}cm]{${filename}.jpg}
  ${caption ? `\\par\\small ${caption}` : ''}
\\end{center}`;
    }).join('\n\n');
  }

  return `\\documentclass[landscape]{article}
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

${methodology ? `\\section*{METODOLOGIA}\n${methodology}\n${imageCommands ? imageCommands + '\n' : ''}` : ''}

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
  let base64Zip: string | null = null;
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

    // Buscar imagens do banco de dados se houver work_id
    let images: any[] = [];
    if (content.work_id && content.user_id) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: imgData } = await supabase
        .from('banner_work_images')
        .select('*')
        .eq('work_id', content.work_id)
        .eq('user_id', content.user_id)
        .order('display_order', { ascending: true });

      if (imgData) {
        // Buscar URLs públicas das imagens
        images = imgData.map(img => {
          const { data: urlData } = supabase.storage
            .from('banner_images')
            .getPublicUrl(img.storage_path);
          return {
            ...img,
            public_url: urlData.publicUrl
          };
        });
      }
    }

    // Generate LaTeX source with proper image filenames
    const imagesForLatex = images.map((img, idx) => ({
      ...img,
      filename: `image_${idx + 1}.jpg`
    }));
    latexSource = generateLatexDocument(content, imagesForLatex);
    
    console.log('LaTeX source generated, length:', latexSource.length);

    // Import base64 encoder and create ZIP com LaTeX e imagens
    const { encode: b64encode } = await import('https://deno.land/std@0.168.0/encoding/base64.ts');
    const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
    const zip = new JSZip();

    // Adicionar arquivo .tex ao ZIP
    zip.file('banner.tex', latexSource);

    // Baixar e adicionar imagens ao ZIP
    console.log('Downloading images for ZIP:', images.length);
    for (let idx = 0; idx < images.length; idx++) {
      const img = images[idx];
      const filename = `image_${idx + 1}.jpg`;
      
      try {
        const imageResponse = await fetch(img.public_url);
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.arrayBuffer();
          zip.file(filename, imageBlob);
          console.log(`Added ${filename} to ZIP`);
        } else {
          console.error(`Failed to download ${filename}:`, imageResponse.status);
        }
      } catch (err) {
        console.error(`Error downloading ${filename}:`, err);
      }
    }

    // Gerar ZIP em base64
    const zipBytes = await zip.generateAsync({ type: 'uint8array' });
    base64Zip = b64encode(zipBytes);
    
    console.log('ZIP generated successfully, size:', zipBytes.length);

    // Usar API do ConvertHub para converter LaTeX em PDF
    const CONVERTHUB_API_KEY = Deno.env.get('CONVERTHUB_API_KEY');
    if (!CONVERTHUB_API_KEY) {
      throw new Error('CONVERTHUB_API_KEY not configured');
    }

    // Converter LaTeX para base64 (UTF-8 safe)
    const latexBase64 = b64encode(new TextEncoder().encode(latexSource));
    
    // Enviar para ConvertHub
    const convertResponse = await fetch('https://api.converthub.com/v2/convert/base64', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONVERTHUB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_base64: latexBase64,
        filename: 'document.tex',
        target_format: 'pdf',
        output_filename: 'banner-academico.pdf',
      }),
    });

    if (!convertResponse.ok) {
      const errorText = await convertResponse.text();
      console.error('ConvertHub conversion failed:', convertResponse.status, errorText);
      throw new Error(`ConvertHub API error: ${convertResponse.status}`);
    }

    const convertData = await convertResponse.json();
    console.log('ConvertHub job created:', convertData.job_id);

    // Se já estiver completo (cache)
    if (convertData.status === 'completed' && convertData.result?.download_url) {
      const pdfResponse = await fetch(convertData.result.download_url);
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const base64Pdf = b64encode(new Uint8Array(pdfBuffer));
      
      return new Response(JSON.stringify({ 
        pdf: base64Pdf,
        latex: latexSource,
        zip: base64Zip,
        message: 'PDF and ZIP generated successfully (cached)' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Polling para aguardar conclusão (max 60s)
    const jobId = convertData.job_id;
    const maxAttempts = 30;
    const pollInterval = 2000; // 2 segundos

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(`https://api.converthub.com/v2/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${CONVERTHUB_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        console.error('Job status check failed:', statusResponse.status);
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`Job ${jobId} status:`, statusData.status);

      if (statusData.status === 'completed' && statusData.result?.download_url) {
        // Baixar o PDF convertido
        const pdfResponse = await fetch(statusData.result.download_url);
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const base64Pdf = b64encode(new Uint8Array(pdfBuffer));
        
        console.log('PDF generated successfully via ConvertHub, size:', pdfBuffer.byteLength);
        
        return new Response(JSON.stringify({ 
          pdf: base64Pdf,
          latex: latexSource,
          zip: base64Zip,
          message: 'PDF and ZIP generated successfully' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      if (statusData.status === 'failed') {
        console.error('ConvertHub job failed:', statusData.error);
        throw new Error(`Conversion failed: ${statusData.error?.message || 'Unknown error'}`);
      }
    }

    // Timeout - retornar LaTeX e ZIP como fallback
    console.warn('ConvertHub job timeout, returning LaTeX source and ZIP');
    throw new Error('Conversion timeout');
  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ 
        compiled: false,
        latex: latexSource || null,
        zip: base64Zip || null,
        message: 'Compilation failed; returning LaTeX source and ZIP (if available).'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})