import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, section } = await req.json();

    // Validar se o conteúdo e a seção foram fornecidos
    if (!content || !section) {
      console.error('Conteúdo ou seção não fornecidos');
      throw new Error('Conteúdo e seção são obrigatórios');
    }

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    
    // Verificar se a chave API está configurada
    if (!Deno.env.get('GEMINI_API_KEY')) {
      console.error('GEMINI_API_KEY não configurada');
      throw new Error('Chave API do Gemini não configurada');
    }

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

    console.log(`Iniciando análise para seção: ${section}`);
    console.log(`Conteúdo a ser analisado: ${content}`);

    const result = await model.generateContent(prompt);
    console.log('Resposta recebida do Gemini');
    
    const response = result.response;
    const text = response.text();
    console.log(`Resposta do Gemini: ${text}`);
    
    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(text);
      console.log('JSON parseado com sucesso');
    } catch (error) {
      console.error('Erro ao fazer parse da resposta do Gemini:', error);
      console.error('Texto recebido:', text);
      
      // Fornecer uma resposta estruturada mesmo em caso de erro de parsing
      analysis = {
        isValid: false,
        grammarErrors: [],
        coherenceIssues: [],
        sectionSpecificIssues: ['Não foi possível analisar o conteúdo adequadamente'],
        suggestions: ['Tente reescrever o texto de forma mais clara e objetiva'],
        overallFeedback: 'Ocorreu um erro ao analisar o conteúdo. A resposta da IA não estava no formato esperado. Por favor, tente novamente com um texto mais claro e objetivo.'
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
    console.error('Erro na função validate-content:', error);
    
    // Fornecer uma resposta estruturada em caso de erro
    const errorResponse = {
      isValid: false,
      grammarErrors: [],
      coherenceIssues: [],
      sectionSpecificIssues: [error.message || 'Erro desconhecido ao processar o conteúdo'],
      suggestions: ['Verifique se o texto foi fornecido corretamente', 'Tente novamente em alguns instantes'],
      overallFeedback: 'Ocorreu um erro ao processar sua solicitação. Por favor, verifique o conteúdo e tente novamente.'
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