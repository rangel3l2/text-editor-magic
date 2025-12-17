/**
 * Converte texto para CAIXA ALTA seguindo padrões IFMS,
 * preservando tags HTML se presentes no texto
 * 
 * @param text - Texto que pode conter HTML ou texto plano
 * @returns Texto em CAIXA ALTA com tags HTML preservadas
 */
export const toUpperCasePreservingHTML = (text: string): string => {
  if (!text) return text;

  const upperPreservingEntities = (chunk: string) =>
    chunk
      // mantém entidades HTML (&nbsp;, &#160;, etc.) intactas
      .split(/(&[a-zA-Z0-9#]+;)/g)
      .map((part) => (part.startsWith('&') && part.endsWith(';') ? part : part.toUpperCase()))
      .join('');

  // Se não contém tags HTML, apenas converter para caixa alta preservando entidades
  if (!/<[^>]+>/.test(text)) {
    return upperPreservingEntities(text);
  }

  // Se contém HTML, processar preservando as tags
  return text.replace(/(<[^>]+>|[^<]+)/g, (match) => {
    // Se é uma tag HTML, manter como está
    if (match.startsWith('<')) {
      return match;
    }
    // Se é texto, converter para caixa alta preservando entidades
    return upperPreservingEntities(match);
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
