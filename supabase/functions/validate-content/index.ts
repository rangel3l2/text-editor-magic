import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, section } = await req.json();
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Analise o seguinte texto para a seção "${section}" de um banner acadêmico e avalie:
      1. Erros gramaticais
      2. Coesão e coerência
      3. Adequação ao tipo de seção (${section})
      4. Sugestões de melhoria

      Texto a ser analisado:
      "${content}"

      Forneça uma análise detalhada seguindo estes critérios específicos para cada tipo de seção:

      Para Introdução:
      - Deve apresentar o tema/problema
      - Deve contextualizar o assunto
      - Deve indicar a relevância do estudo
      - Deve apresentar o objetivo geral

      Para Objetivos:
      - Deve ser claro e direto
      - Deve usar verbos no infinitivo
      - Deve ser mensurável
      - Deve estar alinhado com a introdução

      Para Metodologia:
      - Deve descrever o tipo de pesquisa
      - Deve explicar os procedimentos
      - Deve mencionar instrumentos/técnicas
      - Deve ser reproduzível

      Para Resultados:
      - Deve apresentar dados concretos
      - Deve relacionar com os objetivos
      - Deve ser objetivo e claro
      - Deve incluir análise dos dados

      Para Conclusão:
      - Deve retomar o objetivo
      - Deve sintetizar resultados principais
      - Deve indicar contribuições
      - Deve ser conclusiva

      Forneça a análise em formato JSON com os seguintes campos:
      {
        "isValid": boolean,
        "grammarErrors": string[],
        "coherenceIssues": string[],
        "sectionSpecificIssues": string[],
        "suggestions": string[],
        "overallFeedback": string
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      analysis = {
        isValid: false,
        grammarErrors: [],
        coherenceIssues: [],
        sectionSpecificIssues: ['Erro ao analisar o conteúdo'],
        suggestions: [],
        overallFeedback: 'Ocorreu um erro ao analisar o conteúdo. Por favor, tente novamente.'
      };
    }

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
    return new Response(
      JSON.stringify({
        error: 'Failed to validate content',
        details: error.message
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