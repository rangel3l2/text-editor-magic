
import { supabase } from "@/integrations/supabase/client";

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
    const { data, error } = await supabase.functions.invoke('spellcheck', {
      body: { text }
    });

    if (error) {
      console.error('Erro na verificação ortográfica:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro na verificação ortográfica:', error);
    return [];
  }
};

export const ignoreMisspelling = (word: string) => {
  const ignoredWords = JSON.parse(localStorage.getItem('ignoredWords') || '[]');
  if (!ignoredWords.includes(word)) {
    ignoredWords.push(word);
    localStorage.setItem('ignoredWords', JSON.stringify(ignoredWords));
  }
};

export const getSuggestions = async (word: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('spellcheck', {
      body: { text: word }
    });

    if (error) {
      console.error('Erro ao obter sugestões:', error);
      return [];
    }

    return (data || []).flatMap(result => result.suggestions);
  } catch (error) {
    console.error('Erro ao obter sugestões:', error);
    return [];
  }
};
