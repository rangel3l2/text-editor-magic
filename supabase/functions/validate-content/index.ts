import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
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

    if (!content?.trim() || !section?.trim()) {
      console.error('Missing required fields:', { content: !!content, section: !!section });
      throw new Error('Conteúdo e seção são obrigatórios');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      throw new Error('Chave API do Gemini não configurada');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Você é um especialista em análise de textos acadêmicos.
      Analise o seguinte texto para a seção "${section}" de um banner acadêmico, focando em:
      
      1. Redundância:
         - Identificar palavras ou ideias repetidas
         - Verificar se há informações desnecessárias
         - Sugerir formas mais concisas de expressar as ideias
      
      2. Contextualização:
         - Verificar se o conteúdo está alinhado com o propósito da seção
         - Avaliar se mantém coerência com o tema geral
         - Identificar desvios do assunto principal
      
      Texto a ser analisado:
      "${content}"

      Responda APENAS com um objeto JSON com esta estrutura:
      {
        "isValid": boolean,
        "redundancyIssues": string[],
        "contextIssues": string[],
        "grammarErrors": string[],
        "suggestions": string[],
        "overallFeedback": string
      }

      Critérios por seção:

      Introdução:
      - Apresenta tema e problema claramente
      - Contextualiza sem repetições
      - Justifica relevância sem redundância

      Objetivos:
      - Objetivos únicos e específicos
      - Foco no problema apresentado
      - Evita verbos redundantes

      Metodologia:
      - Procedimentos sem repetição
      - Sequência lógica
      - Relaciona com objetivos

      Resultados:
      - Dados sem redundância
      - Foco nos objetivos
      - Análise clara e objetiva

      Conclusão:
      - Sintetiza sem repetir
      - Relaciona com objetivos/resultados
      - Destaca contribuições únicas

      Feedback em português, objetivo e construtivo.
    `;

    console.log('Sending request to Gemini API...');
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('Received response from Gemini API');
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Gemini response:', text);
      throw new Error('Formato de resposta inválido do Gemini');
    }

    let analysis;
    try {
      analysis = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed JSON response');
    } catch (error) {
      console.error('Error parsing JSON:', error, 'Raw text:', text);
      throw new Error('Erro ao processar resposta do Gemini');
    }

    // Validate JSON structure
    const requiredFields = ['isValid', 'redundancyIssues', 'contextIssues', 'grammarErrors', 'suggestions', 'overallFeedback'];
    const missingFields = requiredFields.filter(field => !(field in analysis));
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      throw new Error('Resposta incompleta do Gemini');
    }

    // Ensure arrays are present even if empty
    analysis.redundancyIssues = analysis.redundancyIssues || [];
    analysis.contextIssues = analysis.contextIssues || [];
    analysis.grammarErrors = analysis.grammarErrors || [];
    analysis.suggestions = analysis.suggestions || [];

    console.log('Sending successful response');

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