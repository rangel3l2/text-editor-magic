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

    if (!content || !section) {
      console.error('Conteúdo ou seção não fornecidos');
      throw new Error('Conteúdo e seção são obrigatórios');
    }

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    
    if (!Deno.env.get('GEMINI_API_KEY')) {
      console.error('GEMINI_API_KEY não configurada');
      throw new Error('Chave API do Gemini não configurada');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Você é um assistente especializado em análise de textos acadêmicos.
      Analise o seguinte texto para a seção "${section}" de um banner acadêmico.
      
      Texto a ser analisado:
      "${content}"

      Forneça uma análise detalhada seguindo estes critérios específicos para cada tipo de seção.
      
      IMPORTANTE: Sua resposta DEVE ser um objeto JSON válido com exatamente esta estrutura:
      {
        "isValid": boolean,
        "grammarErrors": string[],
        "coherenceIssues": string[],
        "sectionSpecificIssues": string[],
        "suggestions": string[],
        "overallFeedback": string
      }

      Critérios por seção:

      Introdução:
      - Apresenta o tema/problema
      - Contextualiza o assunto
      - Indica a relevância do estudo
      - Apresenta o objetivo geral

      Objetivos:
      - É claro e direto
      - Usa verbos no infinitivo
      - É mensurável
      - Está alinhado com a introdução

      Metodologia:
      - Descreve o tipo de pesquisa
      - Explica os procedimentos
      - Menciona instrumentos/técnicas
      - É reproduzível

      Resultados:
      - Apresenta dados concretos
      - Relaciona com os objetivos
      - É objetivo e claro
      - Inclui análise dos dados

      Conclusão:
      - Retoma o objetivo
      - Sintetiza resultados principais
      - Indica contribuições
      - É conclusiva

      LEMBRE-SE: Sua resposta DEVE ser um objeto JSON válido com a estrutura especificada acima.
    `;

    console.log(`Iniciando análise para seção: ${section}`);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('Resposta do Gemini:', text);
    
    // Tenta extrair JSON da resposta, mesmo se estiver dentro de outros textos
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let analysis;
    
    if (jsonMatch) {
      try {
        analysis = JSON.parse(jsonMatch[0]);
        console.log('JSON extraído e parseado com sucesso');
      } catch (error) {
        console.error('Erro ao fazer parse do JSON encontrado:', error);
        throw new Error('Formato de resposta inválido');
      }
    } else {
      console.error('Nenhum JSON encontrado na resposta');
      throw new Error('Formato de resposta inválido');
    }

    // Valida a estrutura do JSON
    const requiredFields = ['isValid', 'grammarErrors', 'coherenceIssues', 'sectionSpecificIssues', 'suggestions', 'overallFeedback'];
    const missingFields = requiredFields.filter(field => !(field in analysis));
    
    if (missingFields.length > 0) {
      console.error('Campos obrigatórios ausentes:', missingFields);
      throw new Error('Resposta incompleta');
    }

    // Garante que arrays estejam presentes mesmo que vazios
    analysis.grammarErrors = analysis.grammarErrors || [];
    analysis.coherenceIssues = analysis.coherenceIssues || [];
    analysis.sectionSpecificIssues = analysis.sectionSpecificIssues || [];
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
    console.error('Erro na função validate-content:', error);
    
    const errorResponse = {
      isValid: false,
      grammarErrors: [],
      coherenceIssues: [],
      sectionSpecificIssues: ['Erro ao processar o conteúdo: ' + (error.message || 'Erro desconhecido')],
      suggestions: ['Tente reescrever o texto de forma mais clara e objetiva'],
      overallFeedback: 'Ocorreu um erro ao analisar seu texto. Por favor, verifique se o conteúdo está bem estruturado e tente novamente.'
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