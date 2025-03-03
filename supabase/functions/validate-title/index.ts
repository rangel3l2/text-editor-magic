
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { contentValidator } from "../_shared/contentValidator.ts";
import { rateLimit } from "../_shared/rateLimiter.ts";

interface ValidateTitleRequest {
  title: string;
  sectionName?: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Implementar limitação de taxa
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await rateLimit(clientIP, "validate-title");
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: `Limite de taxa excedido. Tente novamente em ${Math.ceil(rateLimitResult.timeRemaining / 1000)} segundos.` 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    // Extrair título do corpo da requisição
    const { title, sectionName = "Título" } = await req.json() as ValidateTitleRequest;

    // Validar parâmetros
    if (!title) {
      return new Response(
        JSON.stringify({ error: "Parâmetro title é obrigatório" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validar o título usando o contentValidator
    const result = await contentValidator.validateTitle(title, sectionName);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro durante a validação do título:", error);
    
    return new Response(
      JSON.stringify({ error: `Erro durante a validação: ${error.message}` }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
