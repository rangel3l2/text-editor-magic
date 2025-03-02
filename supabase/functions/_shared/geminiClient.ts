
// Cliente para API do Gemini usando chamadas REST diretas
export function createGeminiClient() {
  const apiKey = Deno.env.get('GEMINI_API_KEY') ?? 'AIzaSyAljMkA_bGrCOrMZOcnI8wsHIS6B1-RX3M';
  
  if (!apiKey) {
    console.error("GEMINI_API_KEY não está definido nas variáveis de ambiente");
    throw new Error("API key não configurada");
  }
  
  return {
    generateContent: async (prompt: string) => {
      try {
        console.log("Gerando conteúdo com o Gemini API v1beta...");
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, 
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }]
            })
          }
        );
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error("Erro na resposta da API Gemini:", errorData);
          throw new Error(`Erro na API Gemini: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Resposta da API Gemini recebida com sucesso");
        
        // Adaptar a resposta para o formato que o resto do código espera
        return {
          response: {
            text: () => {
              // Extrair o texto da primeira parte da resposta
              if (data.candidates && 
                  data.candidates[0] && 
                  data.candidates[0].content && 
                  data.candidates[0].content.parts && 
                  data.candidates[0].content.parts[0]) {
                return data.candidates[0].content.parts[0].text;
              }
              return "";
            }
          }
        };
      } catch (error) {
        console.error("Erro ao gerar conteúdo com o Gemini:", error);
        throw error;
      }
    }
  };
}

// Função auxiliar para listar modelos disponíveis (via fetch)
export async function listAvailableModels() {
  const apiKey = Deno.env.get('GEMINI_API_KEY') ?? 'AIzaSyAljMkA_bGrCOrMZOcnI8wsHIS6B1-RX3M';
  
  try {
    console.log("Listando modelos disponíveis na API Gemini...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro ao listar modelos: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Erro ao listar modelos: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Modelos disponíveis listados com sucesso: ${data.models?.length || 0} modelos encontrados`);
    return data;
  } catch (error) {
    console.error("Erro ao listar modelos:", error);
    throw error;
  }
}
