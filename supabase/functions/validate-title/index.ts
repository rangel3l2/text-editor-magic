
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
    console.log("Função validate-title iniciada");
    const { title } = await req.json();
    
    if (!title) {
      console.error("Requisição inválida: título não fornecido");
      return new Response(
        JSON.stringify({
          error: "Título não fornecido.",
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

    // Validate the title
    console.log("Validando título");
    const result = await validateContent(title, { type: 'title' });

    console.log("Validação de título concluída com sucesso");
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função validate-title:", error);
    
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
