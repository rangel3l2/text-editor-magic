
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { contentValidator } from "../_shared/contentValidator.ts";
import { rateLimit } from "../_shared/rateLimiter.ts";

interface ValidateTitleRequest {
  title: string;
  sectionName: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Implement rate limiting
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

    // Extract title from request body
    const { title, sectionName } = await req.json() as ValidateTitleRequest;

    // Validate parameters
    if (!title) {
      return new Response(
        JSON.stringify({ error: "Parameter title is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validate the title
    const validationResult = await contentValidator.validateTitle(title, sectionName);

    return new Response(
      JSON.stringify(validationResult),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error during title validation:", error);
    
    return new Response(
      JSON.stringify({ error: `Error during title validation: ${error.message}` }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
