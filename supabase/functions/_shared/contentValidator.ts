
import { createGeminiClient } from './geminiClient.ts';
import { RateLimiter } from './rateLimiter.ts';

const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

export async function validateContent(content: string, prompt: any) {
  try {
    console.log("Iniciando validação de conteúdo...");
    const model = createGeminiClient();
    
    // Prepare the validation prompt
    const validationPrompt = buildValidationPrompt(content, prompt);
    console.log("Prompt de validação preparado, chamando API do Gemini...");
    
    // Call Gemini API
    const result = await model.generateContent(validationPrompt);
    const responseText = result.response.text();
    console.log("Resposta do Gemini recebida:", responseText.substring(0, 100) + "...");
    
    // Parse the response
    return parseValidationResponse(responseText);
  } catch (error) {
    console.error("Error validating content:", error);
    return {
      isValid: false,
      overallFeedback: "Houve um erro ao validar o conteúdo. Por favor, tente novamente mais tarde.",
      detailedFeedback: [],
      error: error.message
    };
  }
}

function buildValidationPrompt(content: string, prompt: any) {
  // Create a prompt based on the section and content
  let systemPrompt = '';
  
  if (prompt.type === 'title') {
    systemPrompt = `
      Você é um orientador virtual de trabalhos acadêmicos. Avalie o título abaixo para um banner científico.
      
      Critérios de avaliação:
      1. Clareza e concisão
      2. Relevância acadêmica
      3. Ausência de erros gramaticais
      4. Adequação ao formato de banner científico
      
      Título: "${content}"
      
      Forneça feedback construtivo e responda no seguinte formato JSON:
      {
        "isValid": boolean,
        "overallFeedback": "Feedback geral sobre o título",
        "detailedFeedback": [
          {"aspect": "Aspecto avaliado", "feedback": "Feedback específico", "suggestion": "Sugestão de melhoria"}
        ]
      }
    `;
  } else {
    systemPrompt = `
      Você é um orientador virtual de trabalhos acadêmicos. Avalie o conteúdo abaixo para a seção "${prompt.section}" de um banner científico.
      
      Critérios de avaliação:
      1. Adequação à seção
      2. Clareza e objetividade
      3. Estrutura lógica
      4. Ausência de erros gramaticais
      5. Adequação ao formato de banner científico
      
      Conteúdo:
      "${content}"
      
      Forneça feedback construtivo e responda no seguinte formato JSON:
      {
        "isValid": boolean,
        "overallFeedback": "Feedback geral sobre o conteúdo",
        "detailedFeedback": [
          {"aspect": "Aspecto avaliado", "feedback": "Feedback específico", "suggestion": "Sugestão de melhoria"}
        ]
      }
    `;
  }
  
  return systemPrompt;
}

function parseValidationResponse(responseText: string) {
  try {
    // Extract JSON from the response
    let jsonStr = responseText;
    
    // If the response contains markdown code blocks, extract JSON
    if (responseText.includes('```json')) {
      const matches = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (matches && matches[1]) {
        jsonStr = matches[1];
      }
    } else if (responseText.includes('```')) {
      const matches = responseText.match(/```\s*([\s\S]*?)\s*```/);
      if (matches && matches[1]) {
        jsonStr = matches[1];
      }
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error parsing validation response:", error, responseText);
    return {
      isValid: false,
      overallFeedback: "Não foi possível processar a validação. Por favor, tente novamente.",
      detailedFeedback: [],
      error: "Parsing error"
    };
  }
}

export function isRateLimited(clientId: string) {
  return rateLimiter.isRateLimited(clientId);
}

export function getRemainingRequests(clientId: string) {
  return rateLimiter.getRemainingRequests(clientId);
}

export function getNextAvailableTime(clientId: string) {
  return rateLimiter.getNextAvailableTime(clientId);
}
