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

  let previewHtml = '<div class="banner-content" style="height: 100%;">';
  
  // Header section with logo and institution
  if (content.institutionLogo || processedInstitution) {
    previewHtml += '<header style="display: flex; align-items: center; margin-bottom: 2cm; gap: 1cm;">';
    if (content.institutionLogo) {
      previewHtml += `
        <img 
          src="${content.institutionLogo}" 
          style="height: 2cm; object-fit: contain;" 
          alt="Logo da Instituição"
        />`;
    }
    if (processedInstitution) {
      previewHtml += `
        <div style="font-size: 12pt; flex: 1;">
          ${processedInstitution}
        </div>`;
    }
    previewHtml += '</header>';
  }

  // Title section
  if (processedTitle) {
    previewHtml += `
      <div style="margin-bottom: 1.5cm;">
        <h1 style="font-size: 16pt; font-weight: bold; margin-bottom: 0.5cm; text-align: center;">
          ${processedTitle}
        </h1>`;
    
    if (processedAuthors) {
      previewHtml += `
        <div style="font-size: 12pt; text-align: center;">
          ${processedAuthors}
        </div>`;
    }
    previewHtml += '</div>';
  }

  // Main content sections
  const sections = [
    { title: '1. INTRODUÇÃO', content: content.introduction },
    { title: '2. OBJETIVOS', content: content.objectives },
    { title: '3. METODOLOGIA', content: content.methodology },
    { title: '4. RESULTADOS E DISCUSSÃO', content: content.results },
    { title: '5. CONCLUSÃO', content: content.conclusion },
    { title: '6. REFERÊNCIAS', content: content.references }
  ];

  sections.forEach(({ title, content: sectionContent }) => {
    if (sectionContent) {
      const cleanContent = cleanLatexCommands(sectionContent);
      previewHtml += `
        <section style="margin-bottom: 1.5cm;">
          <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 0.5cm;">
            ${title}
          </h2>
          <div style="font-size: 12pt;">
            ${cleanContent}
          </div>
        </section>`;
    }
  });

  // Acknowledgments section (if present)
  if (content.acknowledgments) {
    const cleanAcknowledgments = cleanLatexCommands(content.acknowledgments);
    previewHtml += `
      <section style="margin-bottom: 1.5cm;">
        <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 0.5cm;">
          AGRADECIMENTOS
        </h2>
        <div style="font-size: 12pt;">
          ${cleanAcknowledgments}
        </div>
      </section>`;
  }

  previewHtml += '</div>';

  // Generate LaTeX content for PDF
  let latexContent = '\\documentclass[12pt,a4paper]{article}\n';
  latexContent += '\\usepackage[utf8]{inputenc}\n';
  latexContent += '\\usepackage[portuguese]{babel}\n';
  latexContent += '\\usepackage[a4paper,margin=2cm]{geometry}\n';
  latexContent += '\\usepackage{multicol}\n';
  latexContent += '\\usepackage{graphicx}\n';
  latexContent += '\\usepackage{setspace}\n';
  latexContent += '\\usepackage{times}\n';
  latexContent += '\\usepackage{enumitem}\n';
  latexContent += '\\setlength{\\parindent}{0pt}\n';
  latexContent += '\\setlength{\\parskip}{6pt}\n';
  latexContent += '\\pagestyle{empty}\n\n';
  latexContent += '\\begin{document}\n\n';

  // Add the same content structure for LaTeX
  if (content.institutionLogo || processedInstitution) {
    latexContent += '\\begin{flushleft}\n';
    if (content.institutionLogo) {
      latexContent += `\\includegraphics[height=2cm]{${content.institutionLogo}}\\hspace{1cm}\n`;
    }
    if (processedInstitution) {
      latexContent += `{\\fontsize{12pt}{14pt}\\selectfont ${processedInstitution}}\n`;
    }
    latexContent += '\\end{flushleft}\n\n';
    latexContent += '\\vspace{2cm}\n\n';
  }

  if (processedTitle) {
    latexContent += '\\begin{center}\n';
    latexContent += `{\\fontsize{16pt}{19pt}\\selectfont\\textbf{${processedTitle}}}\n\n`;
    if (processedAuthors) {
      latexContent += '\\vspace{0.5cm}\n\n';
      latexContent += `{\\fontsize{12pt}{14pt}\\selectfont ${processedAuthors}}\n`;
    }
    latexContent += '\\end{center}\n\n';
    latexContent += '\\vspace{1.5cm}\n\n';
  }

  latexContent += '\\begin{multicols}{2}\n';
  latexContent += '\\setlength{\\columnsep}{1cm}\n\n';

  sections.forEach(({ title, content: sectionContent }) => {
    if (sectionContent) {
      latexContent += `\\noindent{\\fontsize{14pt}{16pt}\\selectfont\\textbf{${title}}}\n\n`;
      latexContent += `{\\fontsize{12pt}{14pt}\\selectfont ${cleanLatexCommands(sectionContent)}}\n\n`;
      latexContent += '\\vspace{1.5cm}\n\n';
    }
  });

  if (content.acknowledgments) {
    latexContent += '\\noindent{\\fontsize{14pt}{16pt}\\selectfont\\textbf{AGRADECIMENTOS}}\n\n';
    latexContent += `{\\fontsize{12pt}{14pt}\\selectfont ${cleanLatexCommands(content.acknowledgments)}}\n\n`;
  }

  latexContent += '\\end{multicols}\n';
  latexContent += '\\end{document}';

  return latexContent;
};