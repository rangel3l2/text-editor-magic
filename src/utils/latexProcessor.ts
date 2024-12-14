export const cleanLatexCommands = (text: string) => {
  if (!text) return '';
  
  return text
    .replace(/\\documentclass.*?\\begin{document}/s, '')
    .replace(/\\end{document}/, '')
    .replace(/\\usepackage.*?\n/g, '')
    .replace(/\\geometry{.*?}/s, '')
    .replace(/\\large/g, '')
    .replace(/\\Large/g, '')
    .replace(/\\textbf{([^}]*)}/g, '$1')
    .replace(/\\textit{([^}]*)}/g, '$1')
    .replace(/\\begin{center}([\s\S]*?)\\end{center}/g, '$1')
    .replace(/\\begin{flushleft}([\s\S]*?)\\end{flushleft}/g, '$1')
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
  latexContent += '\\usepackage[a4paper,left=2cm,right=2cm,top=2cm,bottom=2cm]{geometry}\n';
  latexContent += '\\usepackage{multicol}\n';
  latexContent += '\\usepackage{graphicx}\n';
  latexContent += '\\usepackage{setspace}\n';
  latexContent += '\\usepackage{indentfirst}\n\n';

  latexContent += '\\setlength{\\columnsep}{1cm}\n';
  latexContent += '\\onehalfspacing\n\n';
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

  // Content sections in two columns
  latexContent += '\\begin{multicols}{2}\n';

  // Introduction
  if (content.introduction) {
    latexContent += '\\noindent\\textbf{1. INTRODUÇÃO}\n';
    latexContent += '\\vspace{0.3cm}\n\n';
    latexContent += `${cleanLatexCommands(content.introduction)}\n\n`;
    latexContent += '\\vspace{0.5cm}\n';
  }

  // Objectives
  if (content.objectives) {
    latexContent += '\\noindent\\textbf{2. OBJETIVOS}\n';
    latexContent += '\\vspace{0.3cm}\n\n';
    latexContent += `${cleanLatexCommands(content.objectives)}\n\n`;
    latexContent += '\\vspace{0.5cm}\n';
  }

  // Methodology
  if (content.methodology) {
    latexContent += '\\noindent\\textbf{3. METODOLOGIA}\n';
    latexContent += '\\vspace{0.3cm}\n\n';
    latexContent += `${cleanLatexCommands(content.methodology)}\n\n`;
    latexContent += '\\vspace{0.5cm}\n';
  }

  // Results
  if (content.results) {
    latexContent += '\\noindent\\textbf{4. RESULTADOS E DISCUSSÃO}\n';
    latexContent += '\\vspace{0.3cm}\n\n';
    latexContent += `${cleanLatexCommands(content.results)}\n\n`;
    latexContent += '\\vspace{0.5cm}\n';
  }

  // Conclusion
  if (content.conclusion) {
    latexContent += '\\noindent\\textbf{5. CONCLUSÃO}\n';
    latexContent += '\\vspace{0.3cm}\n\n';
    latexContent += `${cleanLatexCommands(content.conclusion)}\n\n`;
    latexContent += '\\vspace{0.5cm}\n';
  }

  // References
  if (content.references) {
    latexContent += '\\noindent\\textbf{6. REFERÊNCIAS}\n';
    latexContent += '\\vspace{0.3cm}\n\n';
    latexContent += `${cleanLatexCommands(content.references)}\n\n`;
    latexContent += '\\vspace{0.5cm}\n';
  }

  // Acknowledgments
  if (content.acknowledgments) {
    latexContent += '\\noindent\\textbf{AGRADECIMENTOS}\n';
    latexContent += '\\vspace{0.3cm}\n\n';
    latexContent += `${cleanLatexCommands(content.acknowledgments)}\n\n`;
  }

  latexContent += '\\end{multicols}\n';
  latexContent += '\\end{document}';
  return latexContent;
};