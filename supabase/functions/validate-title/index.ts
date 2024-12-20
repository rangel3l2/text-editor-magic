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
    const { title } = await req.json();

    if (!title) {
      throw new Error('Título não fornecido');
    }

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    
    if (!Deno.env.get('GEMINI_API_KEY')) {
      throw new Error('Chave API do Gemini não configurada');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Você é um especialista em análise de títulos acadêmicos.
      Analise o seguinte título de banner acadêmico:
      "${title}"
      
      Critérios de análise:
      1. Clareza e Objetividade:
         - O título deve ser claro e direto
         - Deve informar o tema principal do trabalho
         - Evitar termos ambíguos ou muito técnicos (exceto se for para público especializado)
      
      2. Número de Palavras:
         - Ideal: entre 6 e 8 palavras
         - Máximo: 12 palavras
      
      3. Aspectos Técnicos:
         - Verificar erros ortográficos
         - Analisar coesão e coerência
         - Verificar pontuação
      
      Forneça uma análise detalhada e sugestões de melhoria.
      
      IMPORTANTE: Sua resposta DEVE ser um objeto JSON com esta estrutura:
      {
        "isValid": boolean,
        "wordCount": number,
        "spellingErrors": string[],
        "coherenceIssues": string[],
        "suggestions": string[],
        "improvedVersions": string[],
        "feedback": string
      }
    `;

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
      } catch (error) {
        console.error('Erro ao fazer parse do JSON:', error);
        throw new Error('Formato de resposta inválido');
      }
    } else {
      throw new Error('Formato de resposta inválido');
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
    console.error('Erro na função validate-title:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        isValid: false,
        wordCount: 0,
        spellingErrors: [],
        coherenceIssues: ['Erro ao analisar o título'],
        suggestions: ['Por favor, tente novamente com um título válido'],
        improvedVersions: [],
        feedback: 'Ocorreu um erro ao analisar seu título. Por favor, tente novamente.'
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