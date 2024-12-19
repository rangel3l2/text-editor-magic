export const generateLatexContent = (content: any) => {
  const sections = [];

  // Title and Authors Section
  if (content.title || content.authors || content.institution) {
    sections.push(`
      <div class="banner-section text-center mb-8">
        ${content.title ? `<h1 class="text-2xl font-bold mb-4">${content.title}</h1>` : ''}
        ${content.authors ? `<p class="text-lg mb-2">${content.authors}</p>` : ''}
        ${content.institution ? `<p class="text-lg">${content.institution}</p>` : ''}
      </div>
    `);
  }

  // Introduction Section
  if (content.introduction) {
    sections.push(`
      <div class="banner-section mb-6">
        <h2 class="text-xl font-bold mb-2">Introdução</h2>
        <div>${content.introduction}</div>
      </div>
    `);
  }

  // Objectives Section
  if (content.objectives) {
    sections.push(`
      <div class="banner-section mb-6">
        <h2 class="text-xl font-bold mb-2">Objetivos</h2>
        <div>${content.objectives}</div>
      </div>
    `);
  }

  // Methodology Section
  if (content.methodology) {
    sections.push(`
      <div class="banner-section mb-6">
        <h2 class="text-xl font-bold mb-2">Metodologia</h2>
        <div>${content.methodology}</div>
      </div>
    `);
  }

  // Results Section
  if (content.results) {
    sections.push(`
      <div class="banner-section mb-6">
        <h2 class="text-xl font-bold mb-2">Resultados e Discussão</h2>
        <div>${content.results}</div>
      </div>
    `);
  }

  // Conclusion Section
  if (content.conclusion) {
    sections.push(`
      <div class="banner-section mb-6">
        <h2 class="text-xl font-bold mb-2">Conclusão</h2>
        <div>${content.conclusion}</div>
      </div>
    `);
  }

  // References Section
  if (content.references) {
    sections.push(`
      <div class="banner-section mb-6">
        <h2 class="text-xl font-bold mb-2">Referências</h2>
        <div>${content.references}</div>
      </div>
    `);
  }

  // Acknowledgments Section
  if (content.acknowledgments) {
    sections.push(`
      <div class="banner-section mb-6">
        <h2 class="text-xl font-bold mb-2">Agradecimentos</h2>
        <div>${content.acknowledgments}</div>
      </div>
    `);
  }

  return sections.join('');
};