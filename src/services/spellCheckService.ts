
interface SpellCheckResult {
  word: string;
  suggestions: string[];
  type: 'spelling' | 'grammar';
  message: string;
  offset: number;
  length: number;
}

export const checkSpelling = async (text: string): Promise<SpellCheckResult[]> => {
  try {
    const response = await fetch('/api/spellcheck', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error('Serviço de verificação ortográfica não encontrado');
        return [];
      }
      
      const errorText = await response.text();
      console.error('Erro na resposta do servidor:', errorText);
      return [];
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Resposta inválida do servidor: Esperado JSON, recebido:', contentType);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
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
        'Accept': 'application/json'
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
