
// Cliente para API do Gemini usando chamadas REST diretas
export function createGeminiClient() {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!apiKey) {
    console.error("GEMINI_API_KEY não está definido nas variáveis de ambiente");
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  
  return {
    generateContent: async (prompt: string) => {
      try {
        console.log("Gerando conteúdo com o Gemini API v1beta...");

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }],
              }],
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erro na resposta da API Gemini:", errorText);

          // Tenta extrair retryDelay e status (quando disponível)
          let retryDelaySeconds: number | null = null;
          try {
            const parsed = JSON.parse(errorText);
            const retryDelay = parsed?.error?.details?.find((d: any) => d?.["@type"]?.includes("RetryInfo"))
              ?.retryDelay as string | undefined;

            if (retryDelay) {
              const m = String(retryDelay).match(/(\d+)/);
              if (m?.[1]) retryDelaySeconds = Number(m[1]);
            }
          } catch {
            // ignore parse errors
          }

          const err = new Error(`Erro na API Gemini: ${response.status} ${response.statusText}`) as Error & {
            status?: number;
            retryDelaySeconds?: number | null;
            raw?: string;
          };
          err.status = response.status;
          err.retryDelaySeconds = retryDelaySeconds;
          err.raw = errorText;
          throw err;
        }

        const data = await response.json();
        console.log("Resposta da API Gemini recebida com sucesso");

        // Adaptar a resposta para o formato que o resto do código espera
        return {
          response: {
            text: () => {
              // Extrair o texto da primeira parte da resposta
              if (
                data.candidates &&
                data.candidates[0] &&
                data.candidates[0].content &&
                data.candidates[0].content.parts &&
                data.candidates[0].content.parts[0]
              ) {
                return data.candidates[0].content.parts[0].text;
              }
              return "";
            },
          },
        };
      } catch (error) {
        console.error("Erro ao gerar conteúdo com o Gemini:", error);
        throw error;
      }
    },
  };
}

// Função auxiliar para listar modelos disponíveis (via fetch)
export async function listAvailableModels() {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  
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
