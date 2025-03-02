
// Import generative AI from CDN
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@latest";

export function createGeminiClient() {
  const apiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
  
  if (!apiKey) {
    console.error("GEMINI_API_KEY não está definido nas variáveis de ambiente");
    throw new Error("API key não configurada");
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Por padrão, usa o modelo gemini-pro, mas pode ser alterado conforme necessário
  return genAI.getGenerativeModel({ model: "gemini-pro" });
}

// Função auxiliar para listar modelos disponíveis (via fetch)
export async function listAvailableModels() {
  const apiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
  
  if (!apiKey) {
    console.error("GEMINI_API_KEY não está definido nas variáveis de ambiente");
    throw new Error("API key não configurada");
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao listar modelos: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Erro ao listar modelos:", error);
    throw error;
  }
}
