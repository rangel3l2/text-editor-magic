
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateContent, isRateLimited, getRemainingRequests, getNextAvailableTime } from "../_shared/contentValidator.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    
    if (!title) {
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

    // Validate the title
    const result = await validateContent(title, { type: 'title' });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in validate-title function:", error);
    
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
