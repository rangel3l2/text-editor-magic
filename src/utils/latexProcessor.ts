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

  let html = '<div style="height: 100%;">';
  
  // Header section - Full width, not draggable
  html += '<div style="width: 100%;">';
  
  // Institution logo and name in a flex container
  if (content.institutionLogo || processedInstitution) {
    html += '<div style="display: flex; align-items: center; justify-content: center; gap: 2rem; margin-bottom: 2rem;">';
    if (content.institutionLogo) {
      html += `<img src="${content.institutionLogo}" style="height: 80px; object-fit: contain;" alt="Logo da Instituição" />`;
    }
    if (processedInstitution) {
      html += `<div style="font-size: 16pt; font-weight: bold;">${processedInstitution}</div>`;
    }
    html += '</div>';
  }

  // Title
  if (processedTitle) {
    html += `<h1 style="font-size: 18pt; font-weight: bold; text-align: center; margin-bottom: 1.5rem;">${processedTitle}</h1>`;
  }

  // Authors
  if (processedAuthors) {
    html += `<div style="font-size: 12pt; text-align: center; margin-bottom: 2rem;">${processedAuthors}</div>`;
  }
  html += '</div>';

  // Content sections
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
        <div class="banner-section" style="break-inside: avoid; margin-bottom: 1rem;">
          <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 0.5rem;">${title}</h2>
          <div style="font-size: 12pt;">${cleanContent}</div>
        </div>
      `;
    }
  });

  // Acknowledgments section
  if (content.acknowledgments) {
    const cleanAcknowledgments = cleanLatexCommands(content.acknowledgments);
    html += `
      <div class="banner-section" style="break-inside: avoid; margin-bottom: 1rem;">
        <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 0.5rem;">AGRADECIMENTOS</h2>
        <div style="font-size: 12pt;">${cleanAcknowledgments}</div>
      </div>
    `;
  }

  html += '</div>';

  return html;
};