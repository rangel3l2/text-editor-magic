/**
 * Utilitários para identificação inteligente de hierarquia de seções e subseções
 * em artigos acadêmicos importados.
 */

export interface SectionNode {
  id: string;
  title: string;
  originalTitle: string;
  content: string;
  level: number; // 1 = seção principal, 2 = subseção, 3 = sub-subseção
  number: string; // Ex: "2", "2.1", "2.1.1"
  children?: SectionNode[];
}

/**
 * Detecta o nível hierárquico de um título baseado em padrões comuns
 */
export const detectSectionLevel = (title: string): number => {
  const trimmed = title.trim();
  
  // Remove números do início para análise
  const withoutNumbers = trimmed.replace(/^[\d.]+\s+/, '');
  
  // Padrões de seção principal (nível 1)
  const mainSectionPatterns = [
    /^INTRODUÇÃO/i,
    /^METODOLOGIA/i,
    /^RESULTADOS/i,
    /^DISCUSSÃO/i,
    /^CONCLUSÃO/i,
    /^REFERÊNCIAS/i,
    /^FUNDAMENTAÇÃO TEÓRICA/i,
    /^REFERENCIAL TEÓRICO/i,
    /^REVISÃO DE LITERATURA/i,
    /^DESENVOLVIMENTO/i,
    /^MATERIAIS E MÉTODOS/i,
  ];
  
  if (mainSectionPatterns.some(pattern => pattern.test(withoutNumbers))) {
    return 1;
  }
  
  // Detecta pelo padrão de numeração
  const numberMatch = trimmed.match(/^([\d.]+)\s+/);
  if (numberMatch) {
    const numberParts = numberMatch[1].split('.');
    // Remove pontos vazios no final (ex: "2." vira ["2", ""])
    const validParts = numberParts.filter(p => p.length > 0);
    return validParts.length;
  }
  
  // Se está em MAIÚSCULAS completo, provavelmente é seção principal
  if (withoutNumbers === withoutNumbers.toUpperCase() && withoutNumbers.length > 3) {
    return 1;
  }
  
  // Padrões de subseção (nível 2)
  const subSectionPatterns = [
    /^[A-Z][a-z]+\s+[a-z]/,  // "Conceitos básicos"
    /^[A-Z][a-z]+$/,          // "Conceitos"
  ];
  
  if (subSectionPatterns.some(pattern => pattern.test(withoutNumbers))) {
    return 2;
  }
  
  // Por padrão, assume nível 2 (subseção)
  return 2;
};

/**
 * Extrai o número de seção de um título (ex: "2.1 Título" -> "2.1")
 */
export const extractSectionNumber = (title: string): string | null => {
  const match = title.trim().match(/^([\d.]+)\s+/);
  if (match) {
    // Remove ponto final se existir (ex: "2.1." -> "2.1")
    return match[1].replace(/\.$/, '');
  }
  return null;
};

/**
 * Remove o número de seção do título (ex: "2.1 Título" -> "Título")
 */
export const removeSectionNumber = (title: string): string => {
  return title.trim().replace(/^[\d.]+\s+/, '');
};

/**
 * Constrói a hierarquia de seções a partir de uma lista plana de tópicos
 */
export const buildSectionHierarchy = (
  topics: Array<{ title: string; content: string; order?: string | number }>
): SectionNode[] => {
  const nodes: SectionNode[] = [];
  const stack: SectionNode[] = [];
  
  topics.forEach((topic, index) => {
    const orderStr = topic.order ? String(topic.order) : '';
    const title = topic.title || orderStr || '';
    const level = detectSectionLevel(title);
    const existingNumber = extractSectionNumber(title);
    const cleanTitle = removeSectionNumber(title);
    
    const node: SectionNode = {
      id: `section-${index}`,
      title: cleanTitle,
      originalTitle: title,
      content: topic.content,
      level,
      number: existingNumber || orderStr || '', // Será recalculado
      children: [],
    };
    
    // Remove da pilha todos os nós de nível maior ou igual
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }
    
    if (stack.length === 0) {
      // É uma seção raiz
      nodes.push(node);
    } else {
      // É filho do último nó na pilha
      const parent = stack[stack.length - 1];
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    }
    
    stack.push(node);
  });
  
  return nodes;
};

/**
 * Renumera toda a hierarquia de seções de forma consistente
 */
export const renumberSections = (
  nodes: SectionNode[],
  startNumber: number = 1,
  parentNumber: string = ''
): void => {
  nodes.forEach((node, index) => {
    const currentNumber = startNumber + index;
    node.number = parentNumber 
      ? `${parentNumber}.${currentNumber}` 
      : `${currentNumber}`;
    
    if (node.children && node.children.length > 0) {
      renumberSections(node.children, 1, node.number);
    }
  });
};

/**
 * Aplica numeração inteligente aos tópicos teóricos do artigo
 */
export const applyIntelligentNumbering = (
  theoreticalTopics: Array<{ title: string; content: string; order?: string | number }>
): Array<{ title: string; content: string; order: string; level: number }> => {
  if (!theoreticalTopics || theoreticalTopics.length === 0) {
    return [];
  }
  
  // Constrói a hierarquia
  const hierarchy = buildSectionHierarchy(theoreticalTopics);
  
  // Renumera começando do 2 (após Introdução)
  renumberSections(hierarchy, 2);
  
  // Achata de volta para array linear mantendo hierarquia
  const flatten = (nodes: SectionNode[], result: any[] = []): any[] => {
    nodes.forEach(node => {
      result.push({
        title: node.title,
        content: node.content,
        order: node.number,
        level: node.level,
      });
      if (node.children && node.children.length > 0) {
        flatten(node.children, result);
      }
    });
    return result;
  };
  
  return flatten(hierarchy);
};

/**
 * Calcula o número da seção de Metodologia baseado nos tópicos teóricos
 */
export const getMethodologyNumber = (theoreticalTopicsCount: number): number => {
  // Encontra o maior número de seção principal usado
  return 2 + theoreticalTopicsCount;
};

/**
 * Calcula o número da seção de Resultados baseado nos tópicos teóricos
 */
export const getResultsNumber = (theoreticalTopicsCount: number): number => {
  return 2 + theoreticalTopicsCount + 1;
};
