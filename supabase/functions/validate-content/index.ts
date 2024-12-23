import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RateLimiter } from "../_shared/rateLimiter.ts";
import { GeminiClient } from "../_shared/geminiClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  console.log('Received request to validate-content');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const { content, prompts } = await req.json();
    console.log(`Processing validation request with ${prompts.length} prompts`);
    console.log(`Content length: ${content?.length || 0} characters`);

    if (!content?.trim()) {
      console.error('Missing content field');
      throw new Error('O conteúdo é obrigatório');
    }

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      console.error('Invalid prompts array');
      throw new Error('Prompts inválidos');
    }

    // Get client IP or some identifier for rate limiting
    const clientId = req.headers.get('x-real-ip') || 'default';
    const rateLimiter = RateLimiter.getInstance();
    
    if (rateLimiter.isLimited(clientId)) {
      console.warn(`Rate limit exceeded for client: ${clientId}`);
      const retryAfter = Math.ceil(rateLimiter.getRemainingTime(clientId) / 1000);
      
      return new Response(
        JSON.stringify({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          retryAfter
        }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString()
          }
        }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      throw new Error('Chave API do Gemini não configurada');
    }

    console.log('Initializing Gemini client...');
    const geminiClient = new GeminiClient(apiKey);
    
    try {
      console.log('Analyzing content with Gemini...');
      const analysis = await geminiClient.analyzeContent(content, prompts);
      console.log('Successfully received Gemini analysis');

      // Record successful request in rate limiter
      rateLimiter.recordRequest(clientId);

      return new Response(
        JSON.stringify(analysis),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error in Gemini analysis:', error);
      
      // Check if it's a rate limit error from Gemini
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        return new Response(
          JSON.stringify({
            error: 'GEMINI_RATE_LIMIT',
            message: 'Gemini API rate limit exceeded'
          }),
          { 
            status: 429,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': '300' // 5 minutes
            }
          }
        );
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error in validate-content function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An unexpected error occurred'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});