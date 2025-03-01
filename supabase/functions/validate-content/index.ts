
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateContent } from "../_shared/contentValidator.ts";
import { RateLimiter } from "../_shared/rateLimiter.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Content validation function started");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    const { content, prompts } = await req.json();
    
    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid or missing content" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Use RateLimiter singleton instance
    const limiter = RateLimiter.getInstance();
    const clientId = req.headers.get('x-client-info') || 'unknown-client';
    const isResultsSection = prompts.some(p => 
      p.section?.toLowerCase().includes('resultados') || 
      p.section?.toLowerCase().includes('discussão')
    );
    
    // Check if cached result exists
    const cacheKey = `${content.substring(0, 100)}:${JSON.stringify(prompts)}`;
    const cachedResult = limiter.getCachedResult(cacheKey, isResultsSection);
    if (cachedResult) {
      console.log(`Returning cached result for ${clientId}`);
      return new Response(
        JSON.stringify(cachedResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Apply rate limiting
    if (limiter.isLimited(clientId, isResultsSection)) {
      const waitTime = limiter.getRemainingTime(clientId);
      console.log(`Rate limited client ${clientId}. Must wait ${waitTime}ms`);
      
      return new Response(
        JSON.stringify({
          isValid: true, // Return as valid to prevent blocking user
          overallFeedback: `O orientador virtual está ocupado no momento. Por favor, tente novamente em ${Math.ceil(waitTime/1000)} segundos.`,
          waitTime,
          limited: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Record this request
    limiter.recordRequest(clientId);
    
    console.log(`Validating content with ${content.length} characters`);
    console.log(`Prompts provided: ${JSON.stringify(prompts)}`);
    
    const results = await validateContent(content, prompts);
    
    // Cache the results
    limiter.setCacheResult(cacheKey, results);
    
    console.log(`Sending validation results: ${JSON.stringify(results, null, 2)}`);
    
    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`Error validating content: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        isValid: true, // Return as valid in case of technical error
        overallFeedback: `Não foi possível consultar o orientador virtual devido a um erro técnico. Continue escrevendo seguindo as práticas acadêmicas.`,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 // Return 200 to avoid breaking user experience
      }
    );
  }
});
