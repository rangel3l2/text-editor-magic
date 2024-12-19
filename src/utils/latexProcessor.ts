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

export const generateLatexContent = (content: any) => {
  const processedAuthors = cleanLatexCommands(content.authors);
  const processedTitle = cleanLatexCommands(content.title);
  const processedInstitution = cleanLatexCommands(content.institution);

  let html = '<div style="height: 100%; padding: 2cm;">';
  
  // Header section
  html += '<div style="text-align: center; margin-bottom: 2cm;">';
  
  // Institution logo and name
  if (content.institutionLogo || processedInstitution) {
    html += '<div class="banner-section" style="display: flex; align-items: center; justify-content: center; gap: 1cm; margin-bottom: 1cm;">';
    if (content.institutionLogo) {
      html += `<img src="${content.institutionLogo}" style="height: 2cm; object-fit: contain;" alt="Logo da Instituição" />`;
    }
    if (processedInstitution) {
      html += `<div style="font-size: 14pt; font-weight: bold;">${processedInstitution}</div>`;
    }
    html += '</div>';
  }

  // Title
  if (processedTitle) {
    html += `<div class="banner-section"><h1 style="font-size: 16pt; font-weight: bold; margin-bottom: 0.5cm;">${processedTitle}</h1></div>`;
  }

  // Authors
  if (processedAuthors) {
    html += `<div class="banner-section" style="font-size: 12pt; margin-bottom: 1cm;">${processedAuthors}</div>`;
  }
  html += '</div>';

  // Content sections in two columns
  html += '<div style="column-count: 2; column-gap: 1cm;">';

  // Sections
  const sections = [
    { title: 'INTRODUÇÃO', content: content.introduction },
    { title: 'OBJETIVOS', content: content.objectives },
    { title: 'METODOLOGIA', content: content.methodology },
    { title: 'RESULTADOS E DISCUSSÃO', content: content.results },
    { title: 'CONCLUSÃO', content: content.conclusion },
    { title: 'REFERÊNCIAS', content: content.references }
  ];

  sections.forEach(({ title, content: sectionContent }) => {
    if (sectionContent) {
      const cleanContent = cleanLatexCommands(sectionContent);
      html += `
        <div class="banner-section" style="break-inside: avoid; margin-bottom: 1cm;">
          <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 0.5cm;">${title}</h2>
          <div style="font-size: 12pt;">${cleanContent}</div>
        </div>
      `;
    }
  });

  // Acknowledgments section
  if (content.acknowledgments) {
    const cleanAcknowledgments = cleanLatexCommands(content.acknowledgments);
    html += `
      <div class="banner-section" style="break-inside: avoid; margin-bottom: 1cm;">
        <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 0.5cm;">AGRADECIMENTOS</h2>
        <div style="font-size: 12pt;">${cleanAcknowledgments}</div>
      </div>
    `;
  }

  html += '</div></div>';

  return html;
};