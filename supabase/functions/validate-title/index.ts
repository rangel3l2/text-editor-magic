
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { contentValidator } from "../_shared/contentValidator.ts";
import { rateLimit } from "../_shared/rateLimiter.ts";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    // Rate limiting implementation
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await rateLimit(clientIP, "validate-title");
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: `Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.timeRemaining / 1000)} seconds.` 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    // Extract title and section from request body
    const { title, section } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title parameter is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const result = await contentValidator.validateTitle(title, section || "Title");

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error validating title:", error);
    
    return new Response(
      JSON.stringify({ error: `Error validating title: ${error.message}` }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
