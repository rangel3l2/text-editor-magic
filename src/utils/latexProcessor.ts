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
  const processedAdvisors = cleanLatexCommands(content.advisors);
  const processedTitle = cleanLatexCommands(content.title);
  const processedInstitution = cleanLatexCommands(content.institution);

  let html = '<div style="height: 100%;">';
  
  // Header section with specific classes for extraction
  html += '<div class="banner-header flex items-center justify-between p-4 border-b">';
  
  // Institution logo and name in a flex container
  html += '<div class="flex items-center gap-4">';
  if (content.institutionLogo) {
    html += `<img src="${content.institutionLogo}" alt="Logo da Instituição" class="w-24 h-24 object-contain" />`;
  }
  html += '</div>';
  
  if (processedInstitution) {
    html += `<div class="institution flex-1 text-right text-xl font-semibold">${processedInstitution}</div>`;
  }
  html += '</div>';

  // Title and authors section with reduced spacing
  if (processedTitle || processedAuthors || processedAdvisors) {
    html += '<div class="text-center mt-4 space-y-2">';
    if (processedTitle) {
      html += `<h1 class="text-2xl font-bold">${processedTitle}</h1>`;
    }
    if (processedAuthors) {
      html += `<div class="authors text-sm mt-2">${processedAuthors}</div>`;
    }
    if (processedAdvisors) {
      html += `<div class="advisors text-sm mt-2"><strong>${processedAdvisors}</strong></div>`;
    }
    html += '</div>';
  }

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