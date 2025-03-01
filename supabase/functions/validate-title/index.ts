
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.1";
import { corsHeaders } from "../_shared/cors.ts";
import { rateLimiter } from "../_shared/rateLimiter.ts";

const RATE_LIMIT_PERIOD = 30000; // 30 segundos

serve(async (req) => {
  // Verificar CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar rate-limit
    const rateLimited = await rateLimiter(req, RATE_LIMIT_PERIOD);
    if (rateLimited) {
      return rateLimited;
    }

    // Validar request
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('Erro ao processar JSON do request:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'JSON inválido', 
          isValid: false,
          overallFeedback: "Erro técnico: formato de dados inválido." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { title } = requestData;

    if (!title) {
      console.error('Erro: Título ausente no request');
      return new Response(
        JSON.stringify({ 
          error: 'Título ausente', 
          isValid: false,
          overallFeedback: "Não foi possível validar: título ausente." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Remover tags HTML e limpar o título
    const cleanTitle = title.replace(/<[^>]*>/g, '').trim();
    
    if (!cleanTitle) {
      console.error('Erro: Título vazio após limpeza');
      return new Response(
        JSON.stringify({ 
          error: 'Título vazio', 
          isValid: false,
          overallFeedback: "Não foi possível validar: título vazio após remoção de formatação." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Usar a chave da API Gemini do ambiente
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      console.error('Erro: Chave da API Gemini não configurada');
      return new Response(
        JSON.stringify({ 
          error: 'Chave API ausente', 
          isValid: false,
          overallFeedback: "Não foi possível validar: configuração de API ausente." 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Inicializando modelo Gemini');
    
    try {
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
        
        IMPORTANTE: Sua resposta DEVE ser um objeto JSON válido com esta estrutura:
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
      
      // Adicionar timeout para evitar longos períodos de espera
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao chamar a API do Gemini')), 15000);
      });
      
      const resultPromise = model.generateContent(prompt);
      const result = await Promise.race([resultPromise, timeoutPromise]);
      
      const response = result.response;
      const text = response.text();
      
      console.log('Resposta recebida da API Gemini');
      
      // Log truncado da resposta para debug
      const truncatedText = text.length > 200 ? text.substring(0, 200) + '...' : text;
      console.log('Resposta truncada:', truncatedText);
      
      // Tentar extrair e validar JSON da resposta
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Resposta não contém JSON válido');
        }
        
        const jsonString = jsonMatch[0];
        const parsedResponse = JSON.parse(jsonString);
        
        // Validar campos obrigatórios
        if (parsedResponse.isValid === undefined || parsedResponse.overallFeedback === undefined) {
          throw new Error('Resposta incompleta: campos obrigatórios ausentes');
        }
        
        console.log('Resposta processada com sucesso');
        
        return new Response(
          JSON.stringify(parsedResponse),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (jsonError) {
        console.error('Erro ao processar JSON da resposta:', jsonError);
        console.error('Texto da resposta:', text);
        
        // Fornecer uma resposta de fallback para o cliente
        return new Response(
          JSON.stringify({
            error: 'Erro ao processar resposta',
            isValid: false,
            overallFeedback: "A validação falhou devido a um erro técnico no processamento da resposta.",
            details: {
              suggestions: ["Tente novamente em alguns instantes."],
              improvedVersions: []
            }
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } catch (apiError) {
      console.error('Erro ao chamar API do Gemini:', apiError);
      
      // Verifica se é um erro de autenticação
      const isAuthError = apiError.message?.includes('authentication') || 
                        apiError.message?.includes('API key') ||
                        apiError.message?.includes('credentials');
      
      if (isAuthError) {
        console.error('Erro de autenticação com a API Gemini - chave inválida');
        
        return new Response(
          JSON.stringify({
            error: 'Erro de autenticação da API',
            isValid: false,
            overallFeedback: "Não foi possível validar: erro de autenticação com o serviço de IA."
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Erro de timeout
      if (apiError.message?.includes('Timeout')) {
        console.error('Timeout ao chamar a API Gemini');
        
        return new Response(
          JSON.stringify({
            error: 'Timeout',
            isValid: false,
            overallFeedback: "Não foi possível validar: o serviço de IA demorou muito para responder."
          }),
          { 
            status: 504, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Outros erros
      return new Response(
        JSON.stringify({
          error: 'Erro ao processar o título',
          isValid: false,
          overallFeedback: "Ocorreu um erro técnico durante a validação."
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Erro geral na função:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno no servidor',
        isValid: false,
        overallFeedback: "Ocorreu um erro técnico durante a validação do título."
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
