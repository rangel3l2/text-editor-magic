export const cleanLatexCommands = (text: string) => {
  if (!text) return '';
  
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
    .replace(/\\begin{multicols}{2}.*?\\end{multicols}/gs, '$1')
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

export const generateLatexContent = (content: any) => {
  const processedAuthors = cleanLatexCommands(content.authors);
  const processedAdvisors = cleanLatexCommands(content.advisors);
  const processedTitle = cleanLatexCommands(content.title);
  const processedInstitution = cleanLatexCommands(content.institution);
  const themeColor = content.themeColor || '#1e40af';

  console.log('Generating latex with institutionLogo:', content.institutionLogo);

  const parts: string[] = [];
  
  parts.push('<div style="width: 100%; max-width: 120cm; margin: 0 auto; position: relative; background: white; font-family: Arial, sans-serif; aspect-ratio: 3/4;">');
  
  // Header
  parts.push('<div class="banner-header" style="display: flex; align-items: center; justify-content: space-between; padding: 2rem; border-bottom: 0.5rem solid ' + themeColor + '; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">');
  
  parts.push('<div style="display: flex; align-items: center; gap: 1rem; flex: 1;">');
  if (content.institutionLogo) {
    const maxHeight = content.logoConfig?.maxHeight || 10;
    const width = content.logoConfig?.width || 40;
    parts.push('<img src="' + content.institutionLogo + '" alt="Logo da Instituição" style="max-height: ' + maxHeight + 'rem; width: ' + width + '%; height: auto; object-fit: contain;" />');
  }
  if (processedInstitution) {
    parts.push('<div style="flex: 1; text-align: right; font-size: 1.5rem; font-weight: bold; color: ' + themeColor + ';">' + processedInstitution + '</div>');
  }
  parts.push('</div>');
  
  if (content.eventLogo) {
    parts.push('<img src="' + content.eventLogo + '" alt="Evento" style="max-height: 5rem; width: auto; object-fit: contain; margin-left: 1rem;" />');
  }
  
  parts.push('</div>');

  // Title section
  if (processedTitle || processedAuthors || processedAdvisors) {
    parts.push('<div style="text-align: center; padding: 1.5cm 2cm; background: white;">');
    if (processedTitle) {
      parts.push('<h1 style="font-size: 2.5cm; font-weight: bold; line-height: 1.2; margin-bottom: 0.8cm; color: ' + themeColor + '; text-transform: uppercase;">' + processedTitle + '</h1>');
    }
    if (processedAuthors) {
      parts.push('<div style="font-size: 1.2cm; margin-top: 0.5cm; color: #333;">' + processedAuthors + '</div>');
    }
    if (content.authorEmail) {
      parts.push('<div style="font-size: 0.9cm; margin-top: 0.3cm; color: #666; font-family: monospace;">' + content.authorEmail + '</div>');
    }
    if (processedAdvisors) {
      parts.push('<div style="font-size: 1.1cm; margin-top: 0.5cm; color: #444;"><strong>Orientador(a):</strong> ' + processedAdvisors + '</div>');
    }
    parts.push('</div>');
  }

  // 3 columns
  parts.push('<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5cm; padding: 2cm; min-height: 80cm;">');
  
  // Column 1
  parts.push('<div class="banner-section" style="display: flex; flex-direction: column; justify-content: space-between;">');
  parts.push('<div>');
  if (content.introduction) {
    const cleanIntro = cleanLatexCommands(content.introduction);
    parts.push('<div style="margin-bottom: 1.5cm;">');
    parts.push('<h2 style="font-size: 1.2cm; font-weight: bold; margin-bottom: 0.5cm; color: ' + themeColor + '; border-bottom: 0.15cm solid ' + themeColor + '; padding-bottom: 0.3cm;">INTRODUÇÃO</h2>');
    parts.push('<div style="font-size: 0.8cm; line-height: 1.4; text-align: justify;">' + cleanIntro + '</div>');
    parts.push('</div>');
  }
  if (content.objectives) {
    const cleanObj = cleanLatexCommands(content.objectives);
    parts.push('<div style="margin-bottom: 1.5cm;">');
    parts.push('<h2 style="font-size: 1.2cm; font-weight: bold; margin-bottom: 0.5cm; color: ' + themeColor + '; border-bottom: 0.15cm solid ' + themeColor + '; padding-bottom: 0.3cm;">OBJETIVOS</h2>');
    parts.push('<div style="font-size: 0.8cm; line-height: 1.4; text-align: justify;">' + cleanObj + '</div>');
    parts.push('</div>');
  }
  parts.push('</div>');
  if (content.references) {
    const cleanRef = cleanLatexCommands(content.references);
    parts.push('<div style="margin-top: auto;">');
    parts.push('<h2 style="font-size: 1cm; font-weight: bold; margin-bottom: 0.5cm; color: ' + themeColor + '; border-bottom: 0.15cm solid ' + themeColor + '; padding-bottom: 0.3cm;">REFERÊNCIAS</h2>');
    parts.push('<div style="font-size: 0.6cm; line-height: 1.3; text-align: justify;">' + cleanRef + '</div>');
    parts.push('</div>');
  }
  parts.push('</div>');
  
  // Column 2
  parts.push('<div class="banner-section" style="display: flex; flex-direction: column;">');
  if (content.methodology) {
    const cleanMeth = cleanLatexCommands(content.methodology);
    parts.push('<div style="margin-bottom: 1.5cm;">');
    parts.push('<h2 style="font-size: 1.2cm; font-weight: bold; margin-bottom: 0.5cm; color: ' + themeColor + '; border-bottom: 0.15cm solid ' + themeColor + '; padding-bottom: 0.3cm;">METODOLOGIA</h2>');
    parts.push('<div style="font-size: 0.8cm; line-height: 1.4; text-align: justify;">' + cleanMeth + '</div>');
    parts.push('</div>');
  }
  if (content.results) {
    const cleanRes = cleanLatexCommands(content.results);
    parts.push('<div style="margin-bottom: 1.5cm;">');
    parts.push('<h2 style="font-size: 1.2cm; font-weight: bold; margin-bottom: 0.5cm; color: ' + themeColor + '; border-bottom: 0.15cm solid ' + themeColor + '; padding-bottom: 0.3cm;">RESULTADOS</h2>');
    parts.push('<div style="font-size: 0.8cm; line-height: 1.4; text-align: justify;">' + cleanRes + '</div>');
    parts.push('</div>');
  }
  parts.push('</div>');
  
  // Column 3
  parts.push('<div class="banner-section" style="display: flex; flex-direction: column; justify-content: space-between;">');
  parts.push('<div>');
  if (content.discussion) {
    const cleanDisc = cleanLatexCommands(content.discussion);
    parts.push('<div style="margin-bottom: 1.5cm;">');
    parts.push('<h2 style="font-size: 1.2cm; font-weight: bold; margin-bottom: 0.5cm; color: ' + themeColor + '; border-bottom: 0.15cm solid ' + themeColor + '; padding-bottom: 0.3cm;">DISCUSSÃO</h2>');
    parts.push('<div style="font-size: 0.8cm; line-height: 1.4; text-align: justify;">' + cleanDisc + '</div>');
    parts.push('</div>');
  }
  if (content.conclusion) {
    const cleanConc = cleanLatexCommands(content.conclusion);
    parts.push('<div style="margin-bottom: 1.5cm;">');
    parts.push('<h2 style="font-size: 1.2cm; font-weight: bold; margin-bottom: 0.5cm; color: ' + themeColor + '; border-bottom: 0.15cm solid ' + themeColor + '; padding-bottom: 0.3cm;">CONCLUSÕES</h2>');
    parts.push('<div style="font-size: 0.8cm; line-height: 1.4; text-align: justify;">' + cleanConc + '</div>');
    parts.push('</div>');
  }
  parts.push('</div>');
  if (content.acknowledgments) {
    const cleanAck = cleanLatexCommands(content.acknowledgments);
    parts.push('<div style="margin-top: auto;">');
    parts.push('<h2 style="font-size: 1cm; font-weight: bold; margin-bottom: 0.5cm; color: ' + themeColor + '; border-bottom: 0.15cm solid ' + themeColor + '; padding-bottom: 0.3cm;">AGRADECIMENTOS</h2>');
    parts.push('<div style="font-size: 0.7cm; line-height: 1.3; text-align: justify;">' + cleanAck + '</div>');
    parts.push('</div>');
  }
  parts.push('</div>');
  
  parts.push('</div>');

  // Footer
  parts.push('<div style="position: absolute; bottom: 0; left: 0; right: 0; height: 1.5cm; background: ' + themeColor + '; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.7cm;">');
  if (content.qrCode) {
    parts.push('<img src="' + content.qrCode + '" alt="QR" style="height: 1.2cm; margin-right: 0.5cm;" />');
  }
  parts.push('<span>Banner Científico Profissional | ' + new Date().getFullYear() + '</span>');
  parts.push('</div>');

  parts.push('</div>');
  
  return parts.join('');
};
