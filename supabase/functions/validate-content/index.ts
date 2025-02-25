import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RateLimiter } from "../_shared/rateLimiter.ts";
import { GeminiClient } from "../_shared/geminiClient.ts";
import { validateContent } from "../_shared/contentValidator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function getCacheKey(content: string, prompts: any[]): string {
  return `${content}_${JSON.stringify(prompts)}`;
}

serve(async (req) => {
  console.log('Received request to validate-content');

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const { content, prompts } = await req.json();
    console.log(`Processing validation request with ${prompts?.length || 0} prompts`);

    if (!content?.trim()) {
      throw new Error('O conteúdo é obrigatório');
    }

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      throw new Error('Prompts inválidos');
    }

    const isResultsSection = prompts.some(p => 
      p.section?.toLowerCase().includes('resultados') || 
      p.section?.toLowerCase().includes('discussão')
    );

    const clientId = req.headers.get('x-real-ip') || 'default';
    const rateLimiter = RateLimiter.getInstance();
    
    // Check cache first
    const cacheKey = getCacheKey(content, prompts);
    const cachedResult = rateLimiter.getCachedResult(cacheKey, isResultsSection);
    if (cachedResult) {
      console.log('Returning cached result');
      return new Response(
        JSON.stringify(cachedResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limits
    if (rateLimiter.isLimited(clientId, isResultsSection)) {
      console.warn(`Rate limit exceeded for client: ${clientId}`);
      const retryAfter = Math.ceil(rateLimiter.getRemainingTime(clientId) / 1000);
      const backoffMessage = isResultsSection ? 
        'A seção de Resultados e Discussão requer mais tempo entre validações.' :
        'Muitas requisições em um curto período.';
      
      return new Response(
        JSON.stringify({
          error: 'RATE_LIMIT_EXCEEDED',
          message: backoffMessage,
          retryAfter,
          isValid: false,
          contextIssues: ['O serviço está temporariamente indisponível devido ao alto volume de requisições.'],
          suggestions: ['Por favor, aguarde alguns minutos antes de tentar novamente.'],
          overallFeedback: `Sistema sobrecarregado. Tente novamente em ${retryAfter} segundos.`
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
      throw new Error('Chave API do Gemini não configurada');
    }

    console.log('Initializing Gemini client...');
    const geminiClient = new GeminiClient(apiKey);
    
    try {
      console.log('Analyzing content with Gemini...');
      const analysis = await validateContent(content, prompts, geminiClient);
      console.log('Successfully received Gemini analysis');

      // Cache successful result
      rateLimiter.setCacheResult(cacheKey, analysis);

      // Record successful request and clear any backoff
      rateLimiter.recordRequest(clientId);
      rateLimiter.clearBackoff(clientId);

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
      
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        rateLimiter.setBackoff(clientId);
        const retryAfter = Math.ceil(rateLimiter.getRemainingTime(clientId) / 1000);
        
        return new Response(
          JSON.stringify({
            error: 'GEMINI_RATE_LIMIT',
            message: 'Limite de requisições do Gemini excedido',
            retryAfter,
            isValid: false,
            contextIssues: ['O serviço está temporariamente indisponível.'],
            suggestions: ['Por favor, aguarde alguns minutos antes de tentar novamente.'],
            overallFeedback: `Sistema temporariamente indisponível. Tente novamente em ${retryAfter} segundos.`
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
      
      throw error;
    }
  } catch (error) {
    console.error('Error in validate-content function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Ocorreu um erro inesperado',
        isValid: false,
        contextIssues: ['Ocorreu um erro técnico ao processar sua requisição.'],
        suggestions: ['Por favor, tente novamente em alguns instantes.'],
        overallFeedback: 'Não foi possível validar o conteúdo devido a um erro técnico.'
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