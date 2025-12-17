
// Cliente para API do Gemini com fallback para Lovable AI Gateway
export function createGeminiClient() {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  const hasGemini = !!geminiApiKey;
  const hasLovable = !!lovableApiKey;
  
  if (!hasGemini && !hasLovable) {
    console.error("Nenhuma chave de API configurada (GEMINI_API_KEY ou LOVABLE_API_KEY)");
    throw new Error("É necessário configurar GEMINI_API_KEY ou LOVABLE_API_KEY");
  }
  
  // Função para chamar o Lovable AI Gateway
  async function callLovableGateway(prompt: string): Promise<string> {
    console.log("Chamando Lovable AI Gateway como fallback...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt }
        ],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro no Lovable AI Gateway:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Rate limit excedido no Lovable AI. Tente novamente em alguns segundos.");
      }
      if (response.status === 402) {
        throw new Error("Créditos insuficientes no Lovable AI. Adicione créditos em Settings -> Workspace -> Usage.");
      }
      
      throw new Error(`Erro no Lovable AI Gateway: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
  
  // Função para chamar o Gemini diretamente
  async function callGeminiDirect(prompt: string): Promise<string> {
    console.log("Gerando conteúdo com o Gemini API v1beta...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
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
  }
  
  return {
    generateContent: async (prompt: string) => {
      let lastError: Error | null = null;
      
      // Tenta Gemini primeiro se disponível
      if (hasGemini) {
        try {
          const text = await callGeminiDirect(prompt);
          return {
            response: {
              text: () => text,
            },
          };
        } catch (error) {
          lastError = error as Error;
          const err = error as Error & { status?: number };
          
          // Se for erro 429/quota e temos Lovable como fallback
          if (hasLovable && (err.status === 429 || err.status === 503)) {
            console.log(`Gemini retornou ${err.status}, tentando Lovable AI Gateway...`);
          } else if (!hasLovable) {
            // Não tem fallback, propaga o erro
            throw error;
          } else {
            // Outro erro, propaga
            throw error;
          }
        }
      }
      
      // Fallback para Lovable AI Gateway
      if (hasLovable) {
        try {
          const text = await callLovableGateway(prompt);
          return {
            response: {
              text: () => text,
            },
          };
        } catch (error) {
          console.error("Erro no Lovable AI Gateway:", error);
          // Se também falhou e tínhamos erro anterior do Gemini, mostra ambos
          if (lastError) {
            throw new Error(`Gemini: ${lastError.message}. Lovable: ${(error as Error).message}`);
          }
          throw error;
        }
      }
      
      // Não deveria chegar aqui
      throw lastError || new Error("Nenhum provedor de AI disponível");
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
