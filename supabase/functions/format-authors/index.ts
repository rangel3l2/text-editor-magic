
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { contentValidator } from "../_shared/contentValidator.ts";
import { rateLimit } from "../_shared/rateLimiter.ts";

interface FormatAuthorsRequest {
  authors: string;
  sectionName?: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 // Make sure OPTIONS returns 200 OK
    });
  }

  try {
    // Implementar limitação de taxa
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await rateLimit(clientIP, "format-authors");
    
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

    // Extrair autores do corpo da requisição
    const { authors, sectionName = "Autores" } = await req.json() as FormatAuthorsRequest;

    // Validar parâmetros
    if (!authors) {
      return new Response(
        JSON.stringify({ error: "Parâmetro authors é obrigatório" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Formatar os autores usando o contentValidator
    let formattedAuthors = "";
    
    if (sectionName.toLowerCase().includes("docentes") || sectionName.toLowerCase() === "docentes") {
      formattedAuthors = await contentValidator.formatAdvisors(authors);
    } else {
      formattedAuthors = await contentValidator.formatAuthors(authors);
    }

    return new Response(
      JSON.stringify({ formattedAuthors }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro durante a formatação de autores:", error);
    
    return new Response(
      JSON.stringify({ error: `Erro durante a formatação: ${error.message}` }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
