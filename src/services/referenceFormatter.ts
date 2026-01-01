import { Reference, ReferenceType, CitationType, CitationFormat } from '@/types/reference';

/**
 * Formata autores no padrão ABNT
 * 1 autor: SOBRENOME, Nome
 * 2 autores: SOBRENOME, Nome; SOBRENOME, Nome
 * 3+ autores: SOBRENOME, Nome et al.
 */
export function formatAuthorsABNT(authors: string[]): string {
  if (!authors || authors.length === 0) return '';
  
  // Limpa e normaliza os autores
  const cleanAuthors = authors.map(a => a.trim()).filter(a => a.length > 0);
  
  if (cleanAuthors.length === 1) {
    return cleanAuthors[0];
  }
  
  if (cleanAuthors.length === 2) {
    return cleanAuthors.join('; ');
  }
  
  // 3 ou mais autores: primeiro autor + et al.
  return `${cleanAuthors[0]} et al.`;
}

/**
 * Formata autores para citação no texto
 * Narrativa: Silva (2023) ou Silva e Santos (2023) ou Silva et al. (2023)
 * Parentética: (SILVA, 2023) ou (SILVA; SANTOS, 2023) ou (SILVA et al., 2023)
 */
export function formatAuthorsForCitation(
  authors: string[], 
  format: CitationFormat,
  year: string
): string {
  if (!authors || authors.length === 0) return '';
  
  // Extrai apenas o sobrenome de cada autor
  const surnames = authors.map(author => {
    const parts = author.split(',');
    return parts[0].trim();
  });
  
  if (format === 'narrative') {
    // Primeira letra maiúscula, resto minúsculo
    const formatName = (name: string) => {
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };
    
    if (surnames.length === 1) {
      return `${formatName(surnames[0])} (${year})`;
    }
    if (surnames.length === 2) {
      return `${formatName(surnames[0])} e ${formatName(surnames[1])} (${year})`;
    }
    return `${formatName(surnames[0])} et al. (${year})`;
  } else {
    // Parentético: tudo em maiúsculas
    if (surnames.length === 1) {
      return `(${surnames[0].toUpperCase()}, ${year})`;
    }
    if (surnames.length === 2) {
      return `(${surnames[0].toUpperCase()}; ${surnames[1].toUpperCase()}, ${year})`;
    }
    return `(${surnames[0].toUpperCase()} et al., ${year})`;
  }
}

/**
 * Gera citação formatada ABNT
 */
export function generateCitation(
  reference: Reference,
  type: CitationType,
  format: CitationFormat,
  page?: string,
  quotedText?: string
): string {
  const { authors, year } = reference;
  
  if (type === 'indirect') {
    // Citação indireta: apenas autor e ano
    return formatAuthorsForCitation(authors, format, year);
  }
  
  if (type === 'direct-short') {
    // Citação direta curta: "texto" (AUTOR, ANO, p. XX)
    const citation = format === 'narrative' 
      ? `${formatAuthorsForCitation(authors, format, year).replace(` (${year})`, '')}`
      : '';
    
    const pageRef = page ? `, p. ${page}` : '';
    
    if (format === 'narrative') {
      return quotedText 
        ? `${citation} (${year}${pageRef}) afirma que "${quotedText}"`
        : `${citation} (${year}${pageRef})`;
    } else {
      return quotedText 
        ? `"${quotedText}" (${authors[0].split(',')[0].toUpperCase()}${authors.length > 1 ? ' et al.' : ''}, ${year}${pageRef})`
        : `(${authors[0].split(',')[0].toUpperCase()}${authors.length > 1 ? ' et al.' : ''}, ${year}${pageRef})`;
    }
  }
  
  // Citação direta longa: bloco recuado
  if (type === 'direct-long') {
    const surnames = authors.map(a => a.split(',')[0].trim().toUpperCase());
    const authorStr = surnames.length > 2 
      ? `${surnames[0]} et al.` 
      : surnames.join('; ');
    const pageRef = page ? `, p. ${page}` : '';
    
    return quotedText 
      ? `<blockquote class="citation-block">${quotedText} (${authorStr}, ${year}${pageRef})</blockquote>`
      : `(${authorStr}, ${year}${pageRef})`;
  }
  
  return '';
}

/**
 * Formata referência completa no padrão ABNT
 */
export function formatReferenceABNT(ref: Reference): string {
  const { type, authors, title, year, publisher, location, journal, volume, issue, pages, url, accessDate, edition, bookTitle, organizer, institution, thesisType } = ref;
  
  const authorStr = formatAuthorsABNT(authors);
  const editionStr = edition ? `${edition}. ed. ` : '';
  
  switch (type) {
    case 'book':
      // SOBRENOME, Nome. Título: subtítulo. Edição. Local: Editora, Ano.
      return `${authorStr}. <strong>${title}</strong>. ${editionStr}${location ? `${location}: ` : ''}${publisher || '[s.n.]'}, ${year}.`;
    
    case 'article':
      // SOBRENOME, Nome. Título do artigo. Nome da Revista, Local, v. X, n. X, p. XX-XX, Ano.
      const volumeStr = volume ? `v. ${volume}` : '';
      const issueStr = issue ? `n. ${issue}` : '';
      const pagesStr = pages ? `p. ${pages}` : '';
      const articleDetails = [volumeStr, issueStr, pagesStr].filter(Boolean).join(', ');
      return `${authorStr}. ${title}. <strong>${journal}</strong>, ${location || ''}${location && articleDetails ? ', ' : ''}${articleDetails}, ${year}.`;
    
    case 'website':
      // SOBRENOME, Nome. Título. Ano. Disponível em: URL. Acesso em: Data.
      const formattedAccessDate = accessDate || new Date().toLocaleDateString('pt-BR');
      return `${authorStr}. <strong>${title}</strong>. ${year}. Disponível em: ${url}. Acesso em: ${formattedAccessDate}.`;
    
    case 'thesis':
      // SOBRENOME, Nome. Título. Ano. Tipo – Instituição, Local, Ano.
      const thesisTypeStr = thesisType || 'Trabalho de Conclusão de Curso';
      return `${authorStr}. <strong>${title}</strong>. ${year}. ${thesisTypeStr} – ${institution || '[s.n.]'}${location ? `, ${location}` : ''}, ${year}.`;
    
    case 'chapter':
      // SOBRENOME, Nome do capítulo. Título do capítulo. In: ORGANIZADOR. Título do livro. Local: Editora, Ano. p. XX-XX.
      const orgStr = organizer ? `In: ${organizer}. ` : 'In: ';
      return `${authorStr}. ${title}. ${orgStr}<strong>${bookTitle}</strong>. ${editionStr}${location ? `${location}: ` : ''}${publisher || '[s.n.]'}, ${year}.${pages ? ` p. ${pages}.` : ''}`;
    
    case 'legislation':
      // Legislação tem formato especial
      return `${authorStr}. <strong>${title}</strong>. ${location ? `${location}, ` : ''}${year}.${url ? ` Disponível em: ${url}. Acesso em: ${accessDate || new Date().toLocaleDateString('pt-BR')}.` : ''}`;
    
    default:
      // Formato genérico
      return `${authorStr}. <strong>${title}</strong>. ${location ? `${location}: ` : ''}${publisher ? `${publisher}, ` : ''}${year}.`;
  }
}

/**
 * Ordena referências em ordem alfabética pelo sobrenome do primeiro autor
 */
export function sortReferencesAlphabetically(refs: Reference[]): Reference[] {
  return [...refs].sort((a, b) => {
    const authorA = a.authors[0]?.split(',')[0]?.trim() || '';
    const authorB = b.authors[0]?.split(',')[0]?.trim() || '';
    return authorA.localeCompare(authorB, 'pt-BR', { sensitivity: 'base' });
  });
}

/**
 * Extrai citações do texto HTML
 * Procura por padrões como (SILVA, 2023) ou Silva (2023)
 */
export function extractCitationsFromText(html: string): string[] {
  if (!html) return [];
  
  const citations: string[] = [];
  
  // Padrão parentético: (SOBRENOME, ANO) ou (SOBRENOME; SOBRENOME, ANO)
  const parentheticalPattern = /\(([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s;]+(?:et al\.)?),?\s*(\d{4})(?:,?\s*p\.\s*\d+(?:-\d+)?)?\)/gi;
  
  // Padrão narrativo: Sobrenome (ANO)
  const narrativePattern = /([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+e\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)?(?:\s+et\s+al\.)?)\s*\((\d{4})\)/gi;
  
  let match;
  
  while ((match = parentheticalPattern.exec(html)) !== null) {
    citations.push(match[0]);
  }
  
  while ((match = narrativePattern.exec(html)) !== null) {
    citations.push(match[0]);
  }
  
  return [...new Set(citations)]; // Remove duplicatas
}

/**
 * Verifica se uma citação corresponde a alguma referência
 */
export function findReferenceForCitation(citation: string, references: Reference[]): Reference | null {
  // Extrai sobrenome e ano da citação
  const cleanCitation = citation.replace(/[()]/g, '').trim();
  
  // Tenta extrair ano
  const yearMatch = cleanCitation.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : null;
  
  // Remove ano e pontuação para pegar o sobrenome
  const surnameStr = cleanCitation
    .replace(/\d{4}/g, '')
    .replace(/[,;.]/g, '')
    .replace(/et al\.?/gi, '')
    .replace(/p\.\s*\d+(-\d+)?/gi, '')
    .trim()
    .toUpperCase();
  
  const surnames = surnameStr.split(/\s+e\s+|\s+/).filter(s => s.length > 0);
  
  // Procura referência que corresponda
  return references.find(ref => {
    if (year && ref.year !== year) return false;
    
    const refSurnames = ref.authors.map(a => 
      a.split(',')[0].trim().toUpperCase()
    );
    
    return surnames.some(s => refSurnames.includes(s));
  }) || null;
}

/**
 * Valida se todas as citações têm referências correspondentes
 */
export function validateCitationsAndReferences(
  allTextContent: string,
  references: Reference[]
): {
  orphanCitations: string[];      // Citações sem referência
  uncitedReferences: Reference[]; // Referências não citadas
} {
  const citations = extractCitationsFromText(allTextContent);
  const orphanCitations: string[] = [];
  const citedReferenceIds = new Set<string>();
  
  // Verifica cada citação
  for (const citation of citations) {
    const ref = findReferenceForCitation(citation, references);
    if (ref) {
      citedReferenceIds.add(ref.id);
    } else {
      orphanCitations.push(citation);
    }
  }
  
  // Encontra referências não citadas
  const uncitedReferences = references.filter(ref => !citedReferenceIds.has(ref.id));
  
  return { orphanCitations, uncitedReferences };
}

/**
 * Converte autor no formato "Nome Sobrenome" para "SOBRENOME, Nome"
 */
export function normalizeAuthorName(name: string): string {
  const trimmed = name.trim();
  
  // Se já está no formato "SOBRENOME, Nome", apenas normaliza
  if (trimmed.includes(',')) {
    const [surname, firstName] = trimmed.split(',').map(s => s.trim());
    return `${surname.toUpperCase()}, ${firstName}`;
  }
  
  // Converte "Nome Sobrenome" para "SOBRENOME, Nome"
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].toUpperCase();
  }
  
  const surname = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(' ');
  
  return `${surname.toUpperCase()}, ${firstName}`;
}
