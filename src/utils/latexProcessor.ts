export const cleanLatexCommands = (text: string) => {
  if (!text) return '';
  
  // If text doesn't contain LaTeX commands, return as is (it's HTML)
  if (!text.includes('\\')) {
    return text;
  }
  
  return text
    .replace(/\\documentclass.*?\\begin{document}/s, '')
    .replace(/\\end{document}/, '')
    .replace(/\\usepackage.*?\n/g, '')
    .replace(/\\geometry{.*?}/s, '')
    .replace(/\\large\s*{([^}]*)}/g, '$1')
    .replace(/\\Large\s*{([^}]*)}/g, '$1')
    .replace(/\\textbf{([^}]*)}/g, '$1')
    .replace(/\\textit{([^}]*)}/g, '$1')
    .replace(/\\begin{center}([\s\S]*?)\\end{center}/g, '$1')
    .replace(/\\begin{flushleft}([\s\S]*?)\\end{flushleft}/g, '$1')
    .replace(/\\begin{multicols}{2}([\s\S]*?)\\end{multicols}/gs, '$1')
    .replace(/\\setlength{\\columnsep}{[^}]+}/g, '')
    .replace(/\\vspace{[^}]+}/g, '')
    .replace(/\\noindent/g, '')
    .replace(/\\columnbreak/g, '')
    .replace(/\\{|\\}/g, '')
    .replace(/\{|\}/g, '')
    .trim();
};

export const cleanHtmlTags = (text: string) => {
  if (!text) return '';
  
  let cleaned = text.replace(/<[^>]*>/g, '');
  
  const entityMap: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&ndash;': '\u2013',
    '&mdash;': '\u2014',
    '&rsquo;': '\u2019',
    '&lsquo;': '\u2018',
    '&rdquo;': '\u201D',
    '&ldquo;': '\u201C',
  };
  
  Object.entries(entityMap).forEach(([entity, char]) => {
    cleaned = cleaned.replace(new RegExp(entity, 'g'), char);
  });
  
  cleaned = cleaned.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(dec);
  });
  
  cleaned = cleaned.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  return cleaned.replace(/\s+/g, ' ').trim();
};

export const generateLatexContent = (content: any, images: any[] = []) => {
  const processedAuthors = cleanLatexCommands(content.authors);
  const processedAdvisors = cleanLatexCommands(content.advisors);
  const processedTitle = cleanLatexCommands(content.title);
  const processedInstitution = cleanLatexCommands(content.institution);
  const themeColor = content.themeColor || '#1e40af';

  const parts: string[] = [];
  
  parts.push('<div style="width: 100%; max-width: 120cm; margin: 0 auto; position: relative; background: white; font-family: \'Times New Roman\', Times, serif; padding: 2cm;">');
  
  // Header - Logo e Instituição à esquerda, Título à direita
  parts.push('<div class="banner-header" style="display: grid; grid-template-columns: 1fr 2fr; gap: 2cm; align-items: start; padding-bottom: 1cm; border-bottom: 3px solid #000; margin-bottom: 1cm;">');
  
  // Lado esquerdo: Logo e Instituição
  parts.push('<div style="display: flex; flex-direction: column; gap: 0.5cm;">');
  if (content.institutionLogo) {
    const maxHeight = content.logoConfig?.maxHeight || 8;
    const width = content.logoConfig?.width || 100;
    parts.push('<img src="' + content.institutionLogo + '" alt="Logo da Instituição" style="max-height: ' + maxHeight + 'cm; width: ' + width + '%; height: auto; object-fit: contain; margin-bottom: 0.3cm;" />');
  }
  if (processedInstitution) {
    parts.push('<div style="font-size: 14pt; font-weight: bold; color: #000; line-height: 1.2; text-align: left; text-transform: uppercase;">' + processedInstitution + '</div>');
  }
  parts.push('</div>');
  
  // Lado direito: Título
  if (processedTitle) {
    parts.push('<div style="display: flex; align-items: center; justify-content: center;">');
    parts.push('<h1 style="font-size: 28pt; font-weight: bold; line-height: 1.2; color: #000; text-transform: uppercase; text-align: center; margin: 0;">' + processedTitle + '</h1>');
    parts.push('</div>');
  }
  
  parts.push('</div>');

  // Autores e Orientadores (abaixo do cabeçalho)
  if (processedAuthors || processedAdvisors) {
    parts.push('<div class="authors" style="text-align: center; padding: 0.5cm 0 1cm 0; border-bottom: 1px solid #ccc; margin-bottom: 1cm;">');
    if (processedAuthors) {
      parts.push('<div class="authors-list" style="font-size: 12pt; margin-bottom: 0.2cm; color: #000;">' + processedAuthors + '</div>');
    }
    if (processedAdvisors) {
      parts.push('<div class="advisors" style="font-size: 11pt; color: #333;"><strong>Orientador(a):</strong> ' + processedAdvisors + '</div>');
    }
    parts.push('</div>');
  }

  // Content em 2 colunas
  parts.push('<div style="column-count: 2; column-gap: 2cm; column-rule: 2px solid #000; text-align: justify;">');
  
  if (content.introduction) {
    const cleanIntro = cleanLatexCommands(content.introduction);
    parts.push('<div class="banner-section" style="break-inside: avoid; margin-bottom: 1cm;">');
    parts.push('<h2 style="font-size: 16pt; font-weight: bold; margin-bottom: 0.4cm; color: #000; text-transform: uppercase; text-decoration: underline;">INTRODUÇÃO</h2>');
    parts.push('<div style="font-size: 12pt; line-height: 1.5; text-align: justify; color: #000;">' + cleanIntro + '</div>');
    parts.push('</div>');
  }
  
  if (content.objectives) {
    const cleanObj = cleanLatexCommands(content.objectives);
    parts.push('<div class="banner-section" style="break-inside: avoid; margin-bottom: 1cm;">');
    parts.push('<h2 style="font-size: 16pt; font-weight: bold; margin-bottom: 0.4cm; color: #000; text-transform: uppercase; text-decoration: underline;">OBJETIVOS</h2>');
    parts.push('<div style="font-size: 12pt; line-height: 1.5; text-align: justify; color: #000;">' + cleanObj + '</div>');
    parts.push('</div>');
  }
  
  if (content.methodology) {
    const cleanMeth = cleanLatexCommands(content.methodology);
    parts.push('<div class="banner-section" style="break-inside: avoid; margin-bottom: 1cm;">');
    parts.push('<h2 style="font-size: 16pt; font-weight: bold; margin-bottom: 0.4cm; color: #000; text-transform: uppercase; text-decoration: underline;">METODOLOGIA</h2>');
    parts.push('<div style="font-size: 12pt; line-height: 1.5; text-align: justify; color: #000;">' + cleanMeth + '</div>');
    
    // Add images for methodology section
    images.forEach(img => {
      if (img.caption && img.url) {
        parts.push('<div style="margin: 1cm 0; text-align: center; page-break-inside: avoid;">');
        parts.push(`<div style="font-size: 11pt; font-weight: bold; margin-bottom: 0.3cm; color: #000;">${img.caption}</div>`);
        parts.push(`<img src="${img.url}" alt="${img.caption}" style="max-width: 100%; height: auto; margin-bottom: 0.3cm;" />`);
        if (img.source) {
          parts.push(`<div style="font-size: 10pt; font-style: italic; color: #333;">Fonte: ${img.source}</div>`);
        }
        parts.push('</div>');
      }
    });
    
    parts.push('</div>');
  }
  
  if (content.results) {
    const cleanRes = cleanLatexCommands(content.results);
    parts.push('<div class="banner-section" style="break-inside: avoid; margin-bottom: 1cm;">');
    parts.push('<h2 style="font-size: 16pt; font-weight: bold; margin-bottom: 0.4cm; color: #000; text-transform: uppercase; text-decoration: underline;">RESULTADOS</h2>');
    parts.push('<div style="font-size: 12pt; line-height: 1.5; text-align: justify; color: #000;">' + cleanRes + '</div>');
    
    // Add images for results section (same images displayed here too)
    images.forEach(img => {
      if (img.caption && img.url) {
        parts.push('<div style="margin: 1cm 0; text-align: center; page-break-inside: avoid;">');
        parts.push(`<div style="font-size: 11pt; font-weight: bold; margin-bottom: 0.3cm; color: #000;">${img.caption}</div>`);
        parts.push(`<img src="${img.url}" alt="${img.caption}" style="max-width: 100%; height: auto; margin-bottom: 0.3cm;" />`);
        if (img.source) {
          parts.push(`<div style="font-size: 10pt; font-style: italic; color: #333;">Fonte: ${img.source}</div>`);
        }
        parts.push('</div>');
      }
    });
    
    parts.push('</div>');
  }
  
  if (content.discussion) {
    const cleanDisc = cleanLatexCommands(content.discussion);
    parts.push('<div class="banner-section" style="break-inside: avoid; margin-bottom: 1cm;">');
    parts.push('<h2 style="font-size: 16pt; font-weight: bold; margin-bottom: 0.4cm; color: #000; text-transform: uppercase; text-decoration: underline;">DISCUSSÃO</h2>');
    parts.push('<div style="font-size: 12pt; line-height: 1.5; text-align: justify; color: #000;">' + cleanDisc + '</div>');
    parts.push('</div>');
  }
  
  if (content.conclusion) {
    const cleanConc = cleanLatexCommands(content.conclusion);
    parts.push('<div class="banner-section" style="break-inside: avoid; margin-bottom: 1cm;">');
    parts.push('<h2 style="font-size: 16pt; font-weight: bold; margin-bottom: 0.4cm; color: #000; text-transform: uppercase; text-decoration: underline;">CONCLUSÃO</h2>');
    parts.push('<div style="font-size: 12pt; line-height: 1.5; text-align: justify; color: #000;">' + cleanConc + '</div>');
    parts.push('</div>');
  }
  
  if (content.references) {
    const cleanRef = cleanLatexCommands(content.references);
    parts.push('<div class="banner-section" style="break-inside: avoid; margin-bottom: 1cm;">');
    parts.push('<h2 style="font-size: 16pt; font-weight: bold; margin-bottom: 0.4cm; color: #000; text-transform: uppercase; text-decoration: underline;">REFERÊNCIAS</h2>');
    parts.push('<div style="font-size: 11pt; line-height: 1.4; text-align: justify; color: #000;">' + cleanRef + '</div>');
    parts.push('</div>');
  }
  
  if (content.acknowledgments) {
    const cleanAck = cleanLatexCommands(content.acknowledgments);
    parts.push('<div class="banner-section" style="break-inside: avoid; margin-bottom: 1cm;">');
    parts.push('<h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 0.4cm; color: #000; text-transform: uppercase; text-decoration: underline;">AGRADECIMENTOS</h2>');
    parts.push('<div style="font-size: 11pt; line-height: 1.4; text-align: justify; color: #000;">' + cleanAck + '</div>');
    parts.push('</div>');
  }
  
  parts.push('</div>');

  parts.push('</div>');
  
  return parts.join('');
};
