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

  let latexContent = '\\documentclass[12pt,a4paper]{article}\n';
  latexContent += '\\usepackage[utf8]{inputenc}\n';
  latexContent += '\\usepackage[portuguese]{babel}\n';
  latexContent += '\\usepackage{geometry}\n';
  latexContent += '\\usepackage{multicol}\n';
  latexContent += '\\usepackage{graphicx}\n';
  latexContent += '\\usepackage{setspace}\n';
  latexContent += '\\usepackage{indentfirst}\n\n';

  // A4 page setup with correct margins
  latexContent += '\\geometry{\n';
  latexContent += '  a4paper,\n';
  latexContent += '  left=2cm,\n';
  latexContent += '  right=2cm,\n';
  latexContent += '  top=2cm,\n';
  latexContent += '  bottom=2cm\n';
  latexContent += '}\n\n';

  latexContent += '\\begin{document}\n\n';

  // Institution Logo and Name
  if (content.institutionLogo || processedInstitution) {
    latexContent += '\\begin{center}\n';
    if (content.institutionLogo) {
      latexContent += `\\includegraphics[width=0.3\\textwidth]{${content.institutionLogo}}\n`;
      latexContent += '\\vspace{0.5cm}\n\n';
    }
    if (processedInstitution) {
      latexContent += `{\\large ${processedInstitution}}\n`;
    }
    latexContent += '\\end{center}\n\n';
    latexContent += '\\vspace{1cm}\n\n';
  }

  // Title
  if (processedTitle) {
    latexContent += '\\begin{center}\n';
    latexContent += `{\\Large ${processedTitle}}\n`;
    latexContent += '\\end{center}\n\n';
    latexContent += '\\vspace{1cm}\n\n';
  }

  // Authors
  if (processedAuthors) {
    latexContent += '\\begin{center}\n';
    latexContent += processedAuthors.split('\n').join('\\\\[0.5cm]\n');
    latexContent += '\\end{center}\n\n';
    latexContent += '\\vspace{1cm}\n\n';
  }

  // Two-column content with correct spacing
  latexContent += '\\begin{multicols}{2}\n';
  latexContent += '\\setlength{\\columnsep}{1cm}\n';

  // Content sections
  if (content.introduction) {
    latexContent += '\\noindent\\textbf{1. INTRODUÇÃO}\n\n';
    latexContent += `${cleanLatexCommands(content.introduction)}\n\n`;
    latexContent += '\\vspace{0.5cm}\n\n';
  }

  if (content.objectives) {
    latexContent += '\\noindent\\textbf{2. OBJETIVOS}\n\n';
    latexContent += `${cleanLatexCommands(content.objectives)}\n\n`;
    latexContent += '\\vspace{0.5cm}\n\n';
  }

  if (content.methodology) {
    latexContent += '\\noindent\\textbf{3. METODOLOGIA}\n\n';
    latexContent += `${cleanLatexCommands(content.methodology)}\n\n`;
    latexContent += '\\vspace{0.5cm}\n\n';
  }

  if (content.results) {
    latexContent += '\\noindent\\textbf{4. RESULTADOS E DISCUSSÃO}\n\n';
    latexContent += `${cleanLatexCommands(content.results)}\n\n`;
    latexContent += '\\vspace{0.5cm}\n\n';
  }

  if (content.conclusion) {
    latexContent += '\\noindent\\textbf{5. CONCLUSÃO}\n\n';
    latexContent += `${cleanLatexCommands(content.conclusion)}\n\n`;
    latexContent += '\\vspace{0.5cm}\n\n';
  }

  if (content.references) {
    latexContent += '\\noindent\\textbf{6. REFERÊNCIAS}\n\n';
    latexContent += `${cleanLatexCommands(content.references)}\n\n`;
    latexContent += '\\vspace{0.5cm}\n\n';
  }

  if (content.acknowledgments) {
    latexContent += '\\noindent\\textbf{AGRADECIMENTOS}\n\n';
    latexContent += `${cleanLatexCommands(content.acknowledgments)}\n\n`;
  }

  latexContent += '\\end{multicols}\n';
  latexContent += '\\end{document}';

  return latexContent;
};
