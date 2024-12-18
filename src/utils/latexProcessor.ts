export const cleanLatexCommands = (text: string) => {
  if (!text) return '';
  
  return text
    // Remove LaTeX document structure commands
    .replace(/\\documentclass.*?\\begin{document}/s, '')
    .replace(/\\end{document}/, '')
    .replace(/\\usepackage.*?\n/g, '')
    .replace(/\\geometry{.*?}/s, '')
    
    // Remove specific LaTeX formatting commands while keeping content
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

  // Generate clean HTML for preview
  let previewHtml = '<div class="banner-content">';
  
  // Institution Logo and Name
  if (content.institutionLogo || processedInstitution) {
    previewHtml += '<div style="text-align: center; margin-bottom: 1cm;">';
    if (content.institutionLogo) {
      previewHtml += `<img src="${content.institutionLogo}" style="height: 2cm; margin: 0 auto 0.5cm;" alt="Logo da Instituição" />`;
    }
    if (processedInstitution) {
      previewHtml += `<div style="font-size: 12pt;">${processedInstitution}</div>`;
    }
    previewHtml += '</div>';
  }

  // Title
  if (processedTitle) {
    previewHtml += `<div style="text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 0.5cm;">${processedTitle}</div>`;
  }

  // Authors
  if (processedAuthors) {
    previewHtml += `<div style="text-align: center; font-size: 12pt; margin-bottom: 1cm;">${processedAuthors}</div>`;
  }

  // Content sections
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
        <div style="margin-bottom: 1em;">
          <div style="font-size: 14pt; font-weight: bold;">${title}</div>
          <div style="font-size: 12pt;">${cleanContent}</div>
        </div>`;
    }
  });

  // Acknowledgments (if present)
  if (content.acknowledgments) {
    const cleanAcknowledgments = cleanLatexCommands(content.acknowledgments);
    previewHtml += `
      <div style="margin-bottom: 1em;">
        <div style="font-size: 14pt; font-weight: bold;">AGRADECIMENTOS</div>
        <div style="font-size: 12pt;">${cleanAcknowledgments}</div>
      </div>`;
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
    latexContent += '\\begin{center}\n';
    if (content.institutionLogo) {
      latexContent += `\\includegraphics[height=2cm]{${content.institutionLogo}}\n`;
      latexContent += '\\vspace{0.5cm}\n\n';
    }
    if (processedInstitution) {
      latexContent += `{\\fontsize{12pt}{14pt}\\selectfont ${processedInstitution}}\n`;
    }
    latexContent += '\\end{center}\n\n';
    latexContent += '\\vspace{1cm}\n\n';
  }

  if (processedTitle) {
    latexContent += '\\begin{center}\n';
    latexContent += `{\\fontsize{16pt}{19pt}\\selectfont\\textbf{${processedTitle}}}\n`;
    latexContent += '\\end{center}\n\n';
    latexContent += '\\vspace{0.5cm}\n\n';
  }

  if (processedAuthors) {
    latexContent += '\\begin{center}\n';
    latexContent += `{\\fontsize{12pt}{14pt}\\selectfont ${processedAuthors}}\n`;
    latexContent += '\\end{center}\n\n';
    latexContent += '\\vspace{1cm}\n\n';
  }

  latexContent += '\\begin{multicols}{2}\n';
  latexContent += '\\setlength{\\columnsep}{1cm}\n';

  sections.forEach(({ title, content: sectionContent }) => {
    if (sectionContent) {
      latexContent += `\\noindent{\\fontsize{14pt}{16pt}\\selectfont\\textbf{${title}}}\n\n`;
      latexContent += `{\\fontsize{12pt}{14pt}\\selectfont ${cleanLatexCommands(sectionContent)}}\n\n`;
      latexContent += '\\vspace{1em}\n\n';
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