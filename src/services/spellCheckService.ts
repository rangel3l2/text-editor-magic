
interface SpellCheckResult {
  word: string;
  suggestions: string[];
  type: 'spelling' | 'grammar';
}

export const checkSpelling = async (text: string): Promise<SpellCheckResult[]> => {
  try {
    const response = await fetch('/api/spellcheck', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Falha na verificação ortográfica');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na verificação ortográfica:', error);
    return [];
  }
};

export const ignoreMisspelling = (word: string) => {
  // Adiciona a palavra ao dicionário local de palavras ignoradas
  const ignoredWords = JSON.parse(localStorage.getItem('ignoredWords') || '[]');
  if (!ignoredWords.includes(word)) {
    ignoredWords.push(word);
    localStorage.setItem('ignoredWords', JSON.stringify(ignoredWords));
  }
};

export const getSuggestions = async (word: string): Promise<string[]> => {
  try {
    const response = await fetch(`/api/suggestions?word=${encodeURIComponent(word)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Falha ao obter sugestões');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter sugestões:', error);
    return [];
  }
};
