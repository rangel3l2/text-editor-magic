/**
 * Converte texto para CAIXA ALTA seguindo padrões IFMS,
 * preservando tags HTML se presentes no texto
 * 
 * @param text - Texto que pode conter HTML ou texto plano
 * @returns Texto em CAIXA ALTA com tags HTML preservadas
 */
export const toUpperCasePreservingHTML = (text: string): string => {
  if (!text) return text;
  
  // Se não contém tags HTML, apenas converter para caixa alta
  if (!/<[^>]+>/.test(text)) {
    return text.toUpperCase();
  }
  
  // Se contém HTML, processar preservando as tags
  return text.replace(/(<[^>]+>|[^<]+)/g, (match) => {
    // Se é uma tag HTML, manter como está
    if (match.startsWith('<')) {
      return match;
    }
    // Se é texto, converter para caixa alta
    return match.toUpperCase();
  });
};

/**
 * Converte título e subtítulo para o padrão IFMS (CAIXA ALTA)
 * 
 * @param title - Título do trabalho
 * @param subtitle - Subtítulo do trabalho (opcional)
 * @returns Objeto com título e subtítulo formatados
 */
export const formatTitleIFMS = (title: string, subtitle?: string) => {
  return {
    title: toUpperCasePreservingHTML(title),
    subtitle: subtitle ? toUpperCasePreservingHTML(subtitle) : subtitle
  };
};
