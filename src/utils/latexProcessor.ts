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

  // Institution Logo and Name
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

  // Title
  if (processedTitle) {
    latexContent += '\\begin{center}\n';
    latexContent += `{\\fontsize{16pt}{19pt}\\selectfont\\textbf{${processedTitle}}}\n`;
    latexContent += '\\end{center}\n\n';
    latexContent += '\\vspace{0.5cm}\n\n';
  }

  // Authors
  if (processedAuthors) {
    latexContent += '\\begin{center}\n';
    latexContent += `{\\fontsize{12pt}{14pt}\\selectfont ${processedAuthors}}\n`;
    latexContent += '\\end{center}\n\n';
    latexContent += '\\vspace{1cm}\n\n';
  }

  // Two-column content
  latexContent += '\\begin{multicols}{2}\n';
  latexContent += '\\setlength{\\columnsep}{1cm}\n';

  // Content sections with proper formatting
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
      latexContent += `\\noindent{\\fontsize{14pt}{16pt}\\selectfont\\textbf{${title}}}\n\n`;
      latexContent += `{\\fontsize{12pt}{14pt}\\selectfont ${cleanLatexCommands(sectionContent)}}\n\n`;
      latexContent += '\\vspace{1em}\n\n';
    }
  });

  // Acknowledgments (if present)
  if (content.acknowledgments) {
    latexContent += '\\noindent{\\fontsize{14pt}{16pt}\\selectfont\\textbf{AGRADECIMENTOS}}\n\n';
    latexContent += `{\\fontsize{12pt}{14pt}\\selectfont ${cleanLatexCommands(content.acknowledgments)}}\n\n`;
  }

  latexContent += '\\end{multicols}\n';
  latexContent += '\\end{document}';

  return latexContent;
};
