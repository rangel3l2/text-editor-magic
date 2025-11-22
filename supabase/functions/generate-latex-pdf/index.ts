import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Extract images from HTML content
const extractImagesFromHtml = (html: string): { src: string; alt: string }[] => {
  if (!html) return [];
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*>/g;
  const images: { src: string; alt: string }[] = [];
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    images.push({
      src: match[1],
      alt: match[2] || ''
    });
  }
  return images;
};

// Generate LaTeX document for science fair banner (90cm x 120cm)
const generateLatexDocument = (content: any, images: any[] = [], inlineImages: Map<string, string> = new Map()): string => {
  const cleanLatex = (text: string, sectionName: string = '') => {
    if (!text) return '';

    // First, build LaTeX commands for inline images for this section
    const sectionImages = extractImagesFromHtml(text);
    let imageCommands = '';

    sectionImages.forEach((img, idx) => {
      const imageKey = `${sectionName}_inline_${idx}`;
      if (inlineImages.has(imageKey)) {
        const filename = inlineImages.get(imageKey)!;
        imageCommands += `\n\\vspace{1cm}\n`;
        imageCommands += `\\noindent\\begin{center}\n`;
        imageCommands += `  \\includegraphics[width=15cm]{${filename}}\n\n`;
        if (img.alt) {
          imageCommands += `  \\par\\vspace{0.3cm}\n`;
          imageCommands += `  {\\fontsize{28}{34}\\selectfont\\textit{${img.alt.replace(/[&%$#_{}~^\\]/g, '\\$&')}}}\n\n`;
        }
        imageCommands += `\\end{center}\n`;
        imageCommands += `\\vspace{1cm}\n\n`;
      }
    });

    // Remove img tags from the text so they don't appear as raw HTML
    let cleaned = text.replace(/<img[^>]*>/g, '');
    
    // Remove placeholders de imagens
    cleaned = cleaned.replace(/\[\[placeholder:[^\]]+\]\]/g, '');
    // Remove image markers like [[figura:id]], [[grafico:id]], [[tabela:id]]
    cleaned = cleaned.replace(/(?:🖼️\s*Imagem|📊\s*Gráfico|📋\s*Tabela)?\s*\[\[(figura|grafico|tabela):[^\]]+\]\]/g, '');
    // Remove HTML entities
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    cleaned = cleaned.replace(/&amp;/g, '\\&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&quot;/g, '"');
    // Remove remaining HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    // Remove quebras de linha múltiplas
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    // Escape LaTeX special characters in the text content
    cleaned = cleaned
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/_/g, '\\_')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}');

    // Append the LaTeX image commands AFTER escaping, so they remain valid LaTeX
    return cleaned + imageCommands;
  };

  const title = cleanLatex(content.title || '', 'title');
  const authors = cleanLatex(content.authors || '', 'authors');
  const advisors = cleanLatex(content.advisors || '', 'advisors');
  const institution = cleanLatex(content.institution || '', 'institution');
  const introduction = cleanLatex(content.introduction || '', 'introduction');
  const objectives = cleanLatex(content.objectives || '', 'objectives');
  const methodology = cleanLatex(content.methodology || '', 'methodology');
  const results = cleanLatex(content.results || '', 'results');
  const conclusion = cleanLatex(content.conclusion || '', 'conclusion');
  const references = cleanLatex(content.references || '', 'references');
  const acknowledgments = cleanLatex(content.acknowledgments || '', 'acknowledgments');
  
  // Get column layout (default to 2)
  const columnLayout = content.columnLayout || '2';
  const numColumns = columnLayout === '3' ? 3 : 2;

  // Helper function to generate non-floating image block (compatible with multicols)
  const generateImageCommand = (img: any, idx: number) => {
    const filename = `image_${idx + 1}`;
    const caption = img.caption ? cleanLatex(img.caption) : '';
    const source = img.source ? cleanLatex(img.source) : '';
    const widthCm = img.width_cm || 15;
    
    let cmd = '\n% Imagem inserida sem float para compatibilidade com multicols\n';
    cmd += '\n\\vspace{1cm}\n';
    cmd += '\\noindent\\begin{center}\n';
    cmd += `  \\includegraphics[width=${widthCm}cm]{${filename}.jpg}\n\n`;
    if (caption) {
      cmd += `  \\par\\vspace{0.3cm}\n`;
      cmd += `  {\\fontsize{28}{34}\\selectfont\\textit{${caption}}}\n\n`;
    }
    if (source) {
      cmd += `  \\par\\vspace{0.2cm}\n`;
      cmd += `  {\\fontsize{24}{30}\\selectfont\\textit{Fonte: ${source}}}\n\n`;
    }
    cmd += '\\end{center}\n';
    cmd += '\\vspace{1cm}\n\n';
    return cmd;
  };

  // Organize images by section
  const imagesBySection: Record<string, any[]> = {
    introduction: [],
    objectives: [],
    methodology: [],
    results: [],
    conclusion: [],
  };

  images.forEach((img, idx) => {
    const section = img.section || 'methodology';
    if (imagesBySection[section]) {
      imagesBySection[section].push({ ...img, idx });
    }
  });

  return `\\documentclass{article}

% Fonte estilo Arial (Helvetica)
\\renewcommand{\\familydefault}{\\sfdefault}

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[brazilian]{babel}

\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}

\\usepackage{geometry}
\\usepackage{multicol}
\\usepackage{xcolor}
\\usepackage{graphicx}
\\usepackage{ragged2e}
\\usepackage{setspace}
\\usepackage{float}
\\usepackage{caption}

% Dimensões do banner (90 cm × 120 cm)
\\geometry{
  paperwidth=90cm,
  paperheight=120cm,
  margin=2cm
}

% Espaçamento entre colunas
\\setlength{\\columnsep}{${numColumns === 3 ? '2cm' : '3cm'}}

% Tabulação nos parágrafos
\\setlength{\\parindent}{2cm}

% Espaçamento entre parágrafos
\\setlength{\\parskip}{1em}

% ------- CORES PERSONALIZADAS -------
\\definecolor{titulo}{HTML}{0A4D8C}
\\definecolor{boxbg}{HTML}{E9F2FA}

% Caption styling
\\captionsetup{
  font=small,
  labelfont=bf,
  textfont=it,
  justification=centering
}

\\begin{document}
\\pagestyle{empty}

% ===========================================================
%                    CABEÇALHO / FAIXA
% ===========================================================

  \\begin{center}
  % Imagem de cabeçalho (se fornecida)
  ${content.institutionLogo ? `\\includegraphics[width=\\textwidth, height=10cm, keepaspectratio]{image_header.jpg}` : `{\\fontsize{36}{43}\\selectfont\\textbf{${institution}}}`}
  \\end{center}

% ===========================================================
%                    TÍTULO
% ===========================================================

\\begin{center}
    {\\fontsize{60}{70}\\selectfont \\textbf{\\textcolor{titulo}{\\MakeUppercase{${title}}}} \\par}

    \\vspace{1.5cm}

    {\\fontsize{30}{36}\\selectfont ${authors} \\par}

    ${advisors ? `\\vspace{0.5cm}\n    {\\fontsize{30}{36}\\selectfont \\textbf{Orientador(a): ${advisors}} \\par}` : ''}
\\end{center}

\\vspace{2cm}

% ===========================================================
%                    INÍCIO DAS ${numColumns === 3 ? 'TRÊS' : 'DUAS'} COLUNAS
% ===========================================================

\\begin{multicols}{${numColumns}}
\\justifying
\\fontsize{40}{48}\\selectfont

${introduction ? `% ===========================================================\n%                    INTRODUÇÃO\n% ===========================================================\n\n\\textbf{INTRODUÇÃO}\\par\n\\noindent\\rule{\\linewidth}{3pt}\n\n${introduction}\n${imagesBySection.introduction.map(img => generateImageCommand(img, img.idx)).join('')}\n\\vspace{1cm}\n` : ''}

${objectives ? `% ===========================================================\n%                    OBJETIVOS\n% ===========================================================\n\n\\textbf{OBJETIVOS}\\par\n\\noindent\\rule{\\linewidth}{3pt}\n\n${objectives}\n${imagesBySection.objectives.map(img => generateImageCommand(img, img.idx)).join('')}\n\\vspace{1cm}\n` : ''}

${methodology ? `% ===========================================================\n%                    METODOLOGIA\n% ===========================================================\n\n\\textbf{METODOLOGIA}\\par\n\\noindent\\rule{\\linewidth}{3pt}\n\n${methodology}\n${imagesBySection.methodology.map(img => generateImageCommand(img, img.idx)).join('')}\n\\vspace{1cm}\n` : ''}

${results ? `% ===========================================================\n%                    RESULTADOS E DISCUSSÃO\n% ===========================================================\n\n\\textbf{RESULTADOS E DISCUSSÃO}\\par\n\\noindent\\rule{\\linewidth}{3pt}\n\n${results}\n${imagesBySection.results.map(img => generateImageCommand(img, img.idx)).join('')}\n\\vspace{1cm}\n` : ''}

${conclusion ? `% ===========================================================\n%                    CONCLUSÃO\n% ===========================================================\n\n\\textbf{CONCLUSÃO}\\par\n\\noindent\\rule{\\linewidth}{3pt}\n\n${conclusion}\n${imagesBySection.conclusion.map(img => generateImageCommand(img, img.idx)).join('')}\n\\vspace{1.5cm}\n` : ''}

${references ? `% ===========================================================\n%                    REFERÊNCIAS\n% ===========================================================\n\n\\textbf{REFERÊNCIAS}\\par\n\\noindent\\rule{\\linewidth}{3pt}\n\n${references}\n` : ''}

${acknowledgments ? `\\vspace{1.5cm}\n\n% ===========================================================\n%                    AGRADECIMENTOS\n% ===========================================================\n\n\\textbf{AGRADECIMENTOS}\\par\n\\noindent\\rule{\\linewidth}{3pt}\n\n${acknowledgments}\n` : ''}

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
    const { content, mode = 'pdf', projectTitle = 'banner' } = await req.json()
    
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

    // Extract all inline images from content sections
    const inlineImagesMap = new Map<string, string>();
    const inlineImageUrls: { key: string; url: string }[] = [];
    
    const sections = ['introduction', 'objectives', 'methodology', 'results', 'conclusion', 'acknowledgments'];
    sections.forEach(section => {
      if (content[section]) {
        const sectionImages = extractImagesFromHtml(content[section]);
        sectionImages.forEach((img, idx) => {
          const key = `${section}_inline_${idx}`;
          const filename = `inline_${section}_${idx + 1}.jpg`;
          inlineImagesMap.set(key, filename);
          inlineImageUrls.push({ key, url: img.src });
        });
      }
    });

    // Generate LaTeX source with proper image filenames
    const imagesForLatex = images.map((img, idx) => ({
      ...img,
      filename: `image_${idx + 1}.jpg`
    }));
    latexSource = generateLatexDocument(content, imagesForLatex, inlineImagesMap);
    
    console.log('LaTeX source generated, length:', latexSource.length);

    // Import base64 encoder
    const { encode: b64encode } = await import('https://deno.land/std@0.168.0/encoding/base64.ts');

    // MODE: latex (gerar apenas ZIP com .tex + imagens)
    if (mode === 'latex') {
      const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
      const zip = new JSZip();

      // Sanitizar o título para usar como nome de arquivo
      const sanitizedTitle = projectTitle
        .replace(/[^a-zA-Z0-9\s-_]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50) || 'banner';

      // Adicionar arquivo .tex ao ZIP com o título do trabalho
      zip.file(`${sanitizedTitle}.tex`, latexSource);

      // Adicionar logo de cabeçalho se houver
      if (content.institutionLogo) {
        try {
          const headerResponse = await fetch(content.institutionLogo);
          if (headerResponse.ok) {
            const headerBlob = await headerResponse.arrayBuffer();
            zip.file('image_header.jpg', headerBlob);
            console.log('Added header logo image_header.jpg to ZIP');
          } else {
            console.error('Failed to download header logo:', headerResponse.status);
          }
        } catch (err) {
          console.error('Error downloading header logo:', err);
        }
      }

      // Baixar e adicionar demais imagens ao ZIP
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

      // Baixar e adicionar imagens inline das seções de texto
      console.log('Downloading inline images for ZIP:', inlineImageUrls.length);
      for (const { key, url } of inlineImageUrls) {
        const filename = inlineImagesMap.get(key);
        if (!filename) continue;
        
        try {
          // Handle base64 images
          if (url.startsWith('data:image')) {
            const base64Data = url.split(',')[1];
            const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            zip.file(filename, binaryData);
            console.log(`Added inline base64 image ${filename} to ZIP`);
          } else {
            // Handle URL images
            const imageResponse = await fetch(url);
            if (imageResponse.ok) {
              const imageBlob = await imageResponse.arrayBuffer();
              zip.file(filename, imageBlob);
              console.log(`Added inline image ${filename} to ZIP`);
            } else {
              console.error(`Failed to download inline image ${filename}:`, imageResponse.status);
            }
          }
        } catch (err) {
          console.error(`Error downloading inline image ${filename}:`, err);
        }
      }

      // Gerar ZIP em base64
      const zipBytes = await zip.generateAsync({ type: 'uint8array' });
      base64Zip = b64encode(zipBytes);
      
      console.log('ZIP generated successfully, size:', zipBytes.length);

      return new Response(JSON.stringify({ 
        zip: base64Zip,
        latex: latexSource,
        message: 'LaTeX ZIP generated successfully' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // MODE: pdf (enviar apenas .tex para ConvertHub)
    const CONVERTHUB_API_KEY = Deno.env.get('CONVERTHUB_API_KEY');
    if (!CONVERTHUB_API_KEY) {
      throw new Error('CONVERTHUB_API_KEY not configured');
    }

    // Enviar apenas o arquivo .tex para ConvertHub
    const texBase64 = b64encode(new TextEncoder().encode(latexSource));
    
    const convertResponse = await fetch('https://api.converthub.com/v2/convert/base64', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONVERTHUB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_base64: texBase64,
        filename: 'banner.tex',
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
        message: 'PDF generated successfully (cached)' 
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
          message: 'PDF generated successfully' 
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

    // Timeout - retornar LaTeX como fallback
    console.warn('ConvertHub job timeout, returning LaTeX source');
    throw new Error('Conversion timeout');
  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ 
        compiled: false,
        latex: latexSource || null,
        message: 'Compilation failed; returning LaTeX source (if available).'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})