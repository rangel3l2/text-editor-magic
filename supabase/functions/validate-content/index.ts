
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
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 // Ensure OPTIONS returns 200 OK
    });
  }

  try {
    // Implement rate limiting
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await rateLimit(clientIP, "validate-content");
    
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

    // Extract content from request body
    const { content, prompts, sectionName } = await req.json() as ValidateContentRequest;

    // Validate parameters
    if (!content || !prompts) {
      return new Response(
        JSON.stringify({ error: "Parameters content and prompts are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Validando seção: ${sectionName}`);

    // Process each prompt and validate the content
    const validationResults = [];
    
    for (const prompt of prompts) {
      // If type is 'title', use title validation
      if (prompt.type === 'title') {
        const titleResult = await contentValidator.validateTitle(content, prompt.sectionName || sectionName);
        validationResults.push(titleResult);
      } 
      // If type is 'content', use content validation
      else if (prompt.type === 'content') {
        const contentResult = await contentValidator.validateContent(
          content, 
          prompt.section || sectionName
        );
        validationResults.push(contentResult);
      }
    }

    // If there's only one result, return it directly
    if (validationResults.length === 1) {
      return new Response(
        JSON.stringify(validationResults[0]),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // If there are multiple results, return an object with all of them
    return new Response(
      JSON.stringify({ results: validationResults }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error during validation:", error);
    
    return new Response(
      JSON.stringify({ error: `Error during validation: ${error.message}` }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
