
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateContent, isRateLimited, getRemainingRequests, getNextAvailableTime } from "../_shared/contentValidator.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, prompts } = await req.json();
    
    if (!content || !prompts || !Array.isArray(prompts)) {
      return new Response(
        JSON.stringify({
          error: "Parâmetros inválidos. Necessário content (string) e prompts (array).",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Client ID for rate limiting (use IP address)
    const clientId = req.headers.get("x-forwarded-for") || "unknown";
    
    // Check rate limiting
    if (isRateLimited(clientId)) {
      const remaining = getRemainingRequests(clientId);
      const nextAvailable = getNextAvailableTime(clientId);
      
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

    // Process the first prompt (for now, we only handle one at a time)
    const prompt = prompts[0];
    const result = await validateContent(content, prompt);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in validate-content function:", error);
    
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
