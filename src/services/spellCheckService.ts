
interface SpellCheckResult {
  word: string;
  suggestions: string[];
  type: 'spelling' | 'grammar';
  message: string;
  offset: number;
  length: number;
}

// Dicionário básico em português (poderia ser expandido)
const dictionary = new Set([
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
  'e', 'ou', 'mas', 'porém', 'contudo',
  'título', 'subtítulo', 'introdução', 'desenvolvimento', 'conclusão',
  'artigo', 'científico', 'acadêmico', 'pesquisa',
  'autor', 'autores', 'orientador', 'orientadores',
  'resumo', 'abstract', 'palavras-chave', 'keywords',
  // Adicione mais palavras conforme necessário
]);

// Função para obter sugestões simples
const getSuggestionForWord = (word: string): string[] => {
  const suggestions: string[] = [];
  
  // Verifica se a palavra tem acento faltando
  const accentedVersions: {[key: string]: string} = {
    'titulo': 'título',
    'introducao': 'introdução',
    'conclusao': 'conclusão',
    'cientifica': 'científica',
    'academico': 'acadêmico',
    'pesquisa': 'pesquisa',
    // Adicione mais mapeamentos conforme necessário
  };

  if (accentedVersions[word.toLowerCase()]) {
    suggestions.push(accentedVersions[word.toLowerCase()]);
  }

  return suggestions;
};

// Lista de palavras ignoradas pelo usuário
let ignoredWords = new Set<string>();

export const checkSpelling = async (text: string): Promise<SpellCheckResult[]> => {
  const words = text.split(/\s+/);
  const errors: SpellCheckResult[] = [];
  let offset = 0;

  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:"']/g, '');
    
    if (!dictionary.has(cleanWord) && !ignoredWords.has(cleanWord)) {
      errors.push({
        word: word,
        suggestions: getSuggestionForWord(cleanWord),
        type: 'spelling',
        message: 'Palavra não encontrada no dicionário',
        offset: offset,
        length: word.length
      });
    }
    
    offset += word.length + 1; // +1 para o espaço
  }

  return errors;
};

export const ignoreMisspelling = (word: string) => {
  ignoredWords.add(word.toLowerCase());
};

export const getSuggestions = async (word: string): Promise<string[]> => {
  return getSuggestionForWord(word);
};
