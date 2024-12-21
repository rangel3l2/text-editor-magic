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
    const { content, section } = await req.json();
    console.log(`Processing validation request for section: ${section}`);
    console.log(`Content length: ${content?.length || 0} characters`);

    if (!content?.trim()) {
      console.error('Missing content field');
      throw new Error('O conteúdo é obrigatório');
    }

    if (!section?.trim()) {
      console.error('Missing section field');
      throw new Error('A seção é obrigatória');
    }

    // Get client IP or some identifier for rate limiting
    const clientId = req.headers.get('x-real-ip') || 'default';
    const rateLimiter = RateLimiter.getInstance();
    
    if (rateLimiter.isLimited(clientId)) {
      console.warn(`Rate limit exceeded for client: ${clientId}`);
      const retryAfter = Math.ceil(rateLimiter.getRemainingTime(clientId) / 1000);
      
      return new Response(
        JSON.stringify({
          isValid: false,
          redundancyIssues: [],
          contextIssues: ['Muitas requisições em um curto período de tempo.'],
          grammarErrors: [],
          suggestions: ['Por favor, aguarde alguns minutos antes de tentar novamente.'],
          overallFeedback: 'Limite de requisições excedido. Tente novamente em alguns minutos.'
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
    
    console.log('Analyzing text with Gemini...');
    const analysis = await geminiClient.analyzeText(content, section);
    console.log('Successfully received Gemini analysis');

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
    console.error('Error in validate-content function:', error);
    
    const errorResponse = {
      isValid: false,
      redundancyIssues: [],
      contextIssues: [`Erro ao analisar o texto: ${error.message}`],
      grammarErrors: [],
      suggestions: ['Por favor, tente novamente em alguns instantes'],
      overallFeedback: 'Ocorreu um erro técnico ao analisar seu texto. Nossa equipe foi notificada e está trabalhando para resolver o problema.'
    };

    return new Response(
      JSON.stringify(errorResponse),
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