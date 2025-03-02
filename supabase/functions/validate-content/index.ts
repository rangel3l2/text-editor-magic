import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateContent, isRateLimited, getRemainingRequests, getNextAvailableTime } from "../_shared/contentValidator.ts";

// Definindo CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para limpar tags HTML do conteúdo
const cleanHtmlTags = (text: string) => {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').trim();
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, prompts } = await req.json();
    
    if (!content) {
      return new Response(
        JSON.stringify({
          error: "Conteúdo não fornecido.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Limpa tags HTML do conteúdo antes de validar
    const cleanedContent = cleanHtmlTags(content);
    
    // Resto do código de validação usando o conteúdo limpo
    console.log("Função validate-content iniciada");

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

    // Validate the content
    console.log("Validando conteúdo");
    const result = await validateContent(cleanedContent, prompts);

    console.log("Validação de conteúdo concluída com sucesso");
    return new Response(
      JSON.stringify(result),
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
