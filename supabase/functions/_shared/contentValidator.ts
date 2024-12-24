import { GeminiClient } from "./geminiClient.ts";

export interface ValidationPrompt {
  type: string;
  section?: string;
}

export async function validateContent(
  content: string,
  prompts: ValidationPrompt[],
  geminiClient: GeminiClient
) {
  // Remove imagens do conteúdo se for a seção de Resultados
  const isResultsSection = prompts.some(p => 
    p.section?.toLowerCase().includes('resultados') || 
    p.section?.toLowerCase().includes('discussão')
  );

  let processedContent = content;
  if (isResultsSection) {
    // Remove tags de imagem e seus conteúdos
    processedContent = content.replace(/<figure[^>]*>.*?<\/figure>/gs, '')
                             .replace(/<img[^>]*>/g, '')
                             .trim();
  }

  return await geminiClient.analyzeContent(processedContent, prompts);
}