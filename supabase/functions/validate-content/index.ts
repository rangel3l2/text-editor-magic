
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { contentValidator } from "../_shared/contentValidator.ts";
import { rateLimit } from "../_shared/rateLimiter.ts";

interface ValidateContentRequest {
  content: string;
  prompts: Array<{ type: string; sectionName?: string; section?: string; }>;
  sectionName: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Implementar limitação de taxa
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await rateLimit(clientIP, "validate-content");
    
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

    // Extrair conteúdo do corpo da requisição
    const { content, prompts, sectionName } = await req.json() as ValidateContentRequest;

    // Validar parâmetros
    if (!content || !prompts) {
      return new Response(
        JSON.stringify({ error: "Parâmetros content e prompts são obrigatórios" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Processar cada prompt e validar o conteúdo
    const validationResults = [];
    
    for (const prompt of prompts) {
      // Se o tipo for 'title', usar validação de título
      if (prompt.type === 'title') {
        const titleResult = await contentValidator.validateTitle(content, prompt.sectionName || sectionName);
        validationResults.push(titleResult);
      } 
      // Se o tipo for 'content', usar validação de conteúdo
      else if (prompt.type === 'content') {
        const contentResult = await contentValidator.validateContent(
          content, 
          prompt.section || sectionName
        );
        validationResults.push(contentResult);
      }
    }

    // Se houver apenas um resultado, retorná-lo diretamente
    if (validationResults.length === 1) {
      return new Response(
        JSON.stringify(validationResults[0]),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Se houver múltiplos resultados, retornar um objeto com todos eles
    return new Response(
      JSON.stringify({ results: validationResults }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro durante a validação:", error);
    
    return new Response(
      JSON.stringify({ error: `Erro durante a validação: ${error.message}` }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
