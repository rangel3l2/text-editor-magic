
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

// Adiciona nova função para remover tags HTML
export const cleanHtmlTags = (text: string) => {
  if (!text) return '';
  
  // Remove todas as tags HTML
  return text
    .replace(/<[^>]*>/g, '')
    .trim();
};

export const generateLatexContent = (content: any) => {
  const processedAuthors = cleanLatexCommands(content.authors);
  const processedAdvisors = cleanLatexCommands(content.advisors);
  const processedTitle = cleanLatexCommands(content.title);
  const processedInstitution = cleanLatexCommands(content.institution);

  let html = '<div style="height: 100%;">';
  
  // Header section with specific classes for extraction - Banner style
  html += '<div class="banner-header flex items-center justify-between p-8 border-b-4 border-primary" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);">';
  
  // Institution logo and name in a flex container
  html += '<div class="flex items-center gap-6">';
  if (content.institutionLogo) {
    html += `<img src="${content.institutionLogo}" alt="Logo da Instituição" class="w-48 h-48 object-contain" />`;
  }
  html += '</div>';
  
  if (processedInstitution) {
    html += `<div class="institution flex-1 text-right text-4xl font-bold">${processedInstitution}</div>`;
  }
  html += '</div>';

  // Title and authors section with banner styling
  if (processedTitle || processedAuthors || processedAdvisors) {
    html += '<div class="text-center mt-8 mb-8 space-y-4 px-8">';
    if (processedTitle) {
      html += `<h1 class="text-6xl font-bold leading-tight" style="color: #1e40af;">${processedTitle}</h1>`;
    }
    if (processedAuthors) {
      html += `<div class="authors text-3xl mt-4">${processedAuthors}</div>`;
    }
    if (processedAdvisors) {
      html += `<div class="advisors text-3xl mt-4"><strong>Orientador(a): ${processedAdvisors}</strong></div>`;
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

  // Content in columns (2 columns like science fair banners)
  html += '<div style="column-count: 2; column-gap: 3rem; padding: 2rem;">';
  
  sections.forEach(({ title, content: sectionContent }) => {
    if (sectionContent) {
      const cleanContent = cleanLatexCommands(sectionContent);
      html += `
        <div class="banner-section" style="break-inside: avoid; margin-bottom: 2.5rem;">
          <h2 style="font-size: 32pt; font-weight: bold; margin-bottom: 1rem; color: #1e40af; border-bottom: 4px solid #3b82f6; padding-bottom: 0.5rem;">${title}</h2>
          <div style="font-size: 24pt; line-height: 1.6; text-align: justify;">${cleanContent}</div>
        </div>
      `;
    }
  });

  // Acknowledgments section
  if (content.acknowledgments) {
    const cleanAcknowledgments = cleanLatexCommands(content.acknowledgments);
    html += `
      <div class="banner-section" style="break-inside: avoid; margin-bottom: 2.5rem;">
        <h2 style="font-size: 32pt; font-weight: bold; margin-bottom: 1rem; color: #1e40af; border-bottom: 4px solid #3b82f6; padding-bottom: 0.5rem;">AGRADECIMENTOS</h2>
        <div style="font-size: 24pt; line-height: 1.6; text-align: justify;">${cleanAcknowledgments}</div>
      </div>
    `;
  }

  html += '</div>'; // Close columns div
  html += '</div>'; // Close main div

  return html;
};
