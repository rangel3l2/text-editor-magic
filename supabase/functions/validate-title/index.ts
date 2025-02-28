
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

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
    console.log('Recebida solicitação para validar título');
    
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Erro ao analisar corpo da requisição:', error);
      throw new Error('Formato de requisição inválido. Esperado JSON com campo "title".');
    }
    
    const { title } = body;

    if (!title) {
      console.error('Título não fornecido');
      throw new Error('Título não fornecido');
    }

    // Limpar o título de tags HTML
    const cleanTitle = title.replace(/<[^>]*>/g, '').trim();
    console.log('Título limpo:', cleanTitle);

    if (cleanTitle.length < 5) {
      return new Response(
        JSON.stringify({
          isValid: false,
          overallFeedback: "O título é muito curto. Por favor, forneça um título mais descritivo.",
          details: {
            suggestions: ["Adicione mais detalhes ao título para torná-lo mais informativo"]
          }
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY não configurada');
      throw new Error('Chave API do Gemini não configurada');
    }

    console.log('Inicializando modelo Gemini');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Você é um especialista em análise de títulos acadêmicos.
      Analise o seguinte título de banner acadêmico:
      "${cleanTitle}"
      
      Critérios de análise:
      1. Clareza e Objetividade:
         - O título deve ser claro e direto
         - Deve informar o tema principal do trabalho
         - Evitar termos ambíguos ou muito técnicos (exceto se for para público especializado)
      
      2. Número de Palavras:
         - Ideal: entre 6 e 12 palavras
      
      3. Aspectos Técnicos:
         - Verificar erros ortográficos
         - Analisar coesão e coerência
         - Verificar pontuação
      
      Forneça uma análise detalhada e sugestões de melhoria.
      
      IMPORTANTE: Sua resposta DEVE ser um objeto JSON com esta estrutura:
      {
        "isValid": boolean,
        "overallFeedback": "feedback geral em português",
        "details": {
          "spellingErrors": [],
          "coherenceIssues": [],
          "suggestions": [],
          "improvedVersions": []
        }
      }
    `;

    console.log('Analisando título:', cleanTitle);
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      console.log('Resposta do Gemini recebida');
      
      // Extract JSON from response
      let analysis;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
          console.log('JSON analisado com sucesso');
        } else {
          console.error('Nenhum JSON encontrado na resposta');
          throw new Error('Formato de resposta inválido');
        }
      } catch (parseError) {
        console.error('Erro ao analisar JSON:', parseError, 'Texto recebido:', text);
        // Em caso de erro de parsing, tente criar uma resposta simplificada
        analysis = {
          isValid: false,
          overallFeedback: "Não foi possível analisar completamente o título devido a um erro técnico.",
          details: {
            spellingErrors: [],
            coherenceIssues: [],
            suggestions: ["Tente novamente em alguns instantes."],
            improvedVersions: []
          }
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
      console.error('Erro ao chamar API do Gemini:', error);
      throw new Error('Erro ao processar o título com a API Gemini');
    }
  } catch (error) {
    console.error('Erro na função validate-title:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno do servidor',
        isValid: false,
        overallFeedback: 'Ocorreu um erro ao analisar seu título. Por favor, tente novamente.',
        details: {
          spellingErrors: [],
          coherenceIssues: ['Erro ao analisar o título'],
          suggestions: ['Por favor, tente novamente com um título válido'],
          improvedVersions: []
        }
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
