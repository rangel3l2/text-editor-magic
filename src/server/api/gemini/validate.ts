
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ValidationResult {
  errors: Array<{
    word: string;
    type: 'spelling' | 'grammar';
    suggestions: string[];
  }>;
}

export const validateContent = async (
  text: string,
  apiKey: string
): Promise<ValidationResult> => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Você é um revisor de texto em português do Brasil.
    Analise o texto abaixo e retorne apenas um array JSON com os erros ortográficos e gramaticais.
    Para cada erro inclua a palavra, tipo (spelling ou grammar) e sugestões de correção.
    
    Texto:
    ${text}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const validation = JSON.parse(response.text());

    return {
      errors: validation.map((error: any) => ({
        word: error.word,
        type: error.type,
        suggestions: error.suggestions
      }))
    };
  } catch (error) {
    console.error('Error validating content:', error);
    return { errors: [] };
  }
};
