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

    if (!content || !section) {
      console.error('Content or section not provided');
      throw new Error('Conteúdo e seção são obrigatórios');
    }

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    
    if (!Deno.env.get('GEMINI_API_KEY')) {
      console.error('GEMINI_API_KEY not configured');
      throw new Error('Chave API do Gemini não configurada');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Você é um especialista em análise de textos acadêmicos.
      Analise o seguinte texto para a seção "${section}" de um banner acadêmico, focando especialmente em:
      
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

      IMPORTANTE: Sua resposta DEVE ser um objeto JSON com exatamente esta estrutura:
      {
        "isValid": boolean,
        "redundancyIssues": string[],
        "contextIssues": string[],
        "grammarErrors": string[],
        "suggestions": string[],
        "overallFeedback": string
      }

      Critérios específicos por seção:

      Introdução:
      - Apresenta claramente o tema e problema
      - Contextualiza sem repetições
      - Justifica a relevância sem redundância

      Objetivos:
      - Cada objetivo é único e específico
      - Mantém foco no problema apresentado
      - Evita verbos redundantes

      Metodologia:
      - Descreve procedimentos sem repetição
      - Mantém sequência lógica
      - Relaciona com objetivos

      Resultados:
      - Apresenta dados sem redundância
      - Mantém foco nos objetivos propostos
      - Análise clara e objetiva

      Conclusão:
      - Sintetiza sem repetir literalmente
      - Relaciona com objetivos e resultados
      - Destaca contribuições únicas

      Forneça feedback construtivo e específico em português.
    `;

    console.log(`Starting analysis for section: ${section}`);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('Gemini response:', text);
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let analysis;
    
    if (jsonMatch) {
      try {
        analysis = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed JSON response');
      } catch (error) {
        console.error('Error parsing JSON:', error);
        throw new Error('Formato de resposta inválido');
      }
    } else {
      console.error('No JSON found in response');
      throw new Error('Formato de resposta inválido');
    }

    // Validate JSON structure
    const requiredFields = ['isValid', 'redundancyIssues', 'contextIssues', 'grammarErrors', 'suggestions', 'overallFeedback'];
    const missingFields = requiredFields.filter(field => !(field in analysis));
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      throw new Error('Resposta incompleta');
    }

    // Ensure arrays are present even if empty
    analysis.redundancyIssues = analysis.redundancyIssues || [];
    analysis.contextIssues = analysis.contextIssues || [];
    analysis.grammarErrors = analysis.grammarErrors || [];
    analysis.suggestions = analysis.suggestions || [];

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
      contextIssues: ['Erro ao analisar o contexto do texto'],
      grammarErrors: [],
      suggestions: ['Por favor, tente reescrever o texto de forma mais clara e objetiva'],
      overallFeedback: 'Ocorreu um erro ao analisar seu texto. Verifique se o conteúdo está bem estruturado e tente novamente.'
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