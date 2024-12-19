import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.0";

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

    console.log(`Iniciando análise para seção: ${section}`);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('Resposta do Gemini:', text);
    
    // Extrai o JSON da resposta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let analysis;
    
    if (jsonMatch) {
      try {
        analysis = JSON.parse(jsonMatch[0]);
        console.log('JSON extraído e parseado com sucesso');
      } catch (error) {
        console.error('Erro ao fazer parse do JSON:', error);
        throw new Error('Formato de resposta inválido');
      }
    } else {
      console.error('Nenhum JSON encontrado na resposta');
      throw new Error('Formato de resposta inválido');
    }

    // Valida a estrutura do JSON
    const requiredFields = ['isValid', 'redundancyIssues', 'contextIssues', 'grammarErrors', 'suggestions', 'overallFeedback'];
    const missingFields = requiredFields.filter(field => !(field in analysis));
    
    if (missingFields.length > 0) {
      console.error('Campos obrigatórios ausentes:', missingFields);
      throw new Error('Resposta incompleta');
    }

    // Garante que arrays estejam presentes mesmo que vazios
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
    console.error('Erro na função validate-content:', error);
    
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