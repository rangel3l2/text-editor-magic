
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateContent, isRateLimited, getRemainingRequests, getNextAvailableTime } from "../_shared/contentValidator.ts";

// Definindo CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Função validate-content iniciada");
    const { content, prompts } = await req.json();
    
    if (!content || !prompts || !Array.isArray(prompts) || prompts.length === 0) {
      console.error("Requisição inválida: conteúdo ou prompts não fornecidos");
      return new Response(
        JSON.stringify({
          error: "Conteúdo ou prompts não fornecidos.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Client ID for rate limiting (use IP address)
    const clientId = req.headers.get("x-forwarded-for") || "unknown";
    console.log(`Cliente ID para rate limiting: ${clientId}`);
    
    // Check rate limiting
    if (isRateLimited(clientId)) {
      const remaining = getRemainingRequests(clientId);
      const nextAvailable = getNextAvailableTime(clientId);
      
      console.warn(`Taxa de requisições excedida para cliente ${clientId}`);
      return new Response(
        JSON.stringify({
          error: "Taxa de requisições excedida. Tente novamente mais tarde.",
          remaining,
          nextAvailable,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate the content for each prompt
    console.log(`Processando ${prompts.length} prompts`);
    const results = [];
    
    for (const prompt of prompts) {
      console.log(`Validando conteúdo para prompt tipo: ${prompt.type}, seção: ${prompt.section || 'N/A'}`);
      const result = await validateContent(content, prompt);
      results.push({
        ...result,
        promptType: prompt.type,
        section: prompt.section,
      });
    }

    console.log("Validação concluída com sucesso");
    return new Response(
      JSON.stringify(results.length === 1 ? results[0] : results),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função validate-content:", error);
    
    return new Response(
      JSON.stringify({
        error: `Erro interno do servidor: ${error.message}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
