
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

    const { content, prompts } = await req.json();
    
    // Validação do formato dos dados de entrada
    if (!content) {
      console.error('Erro: Conteúdo ausente ou vazio');
      return new Response(
        JSON.stringify({
          error: 'Conteúdo ausente ou vazio',
          isValid: false,
          overallFeedback: "Não foi possível validar: o conteúdo está vazio."
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      console.error('Erro: Prompts ausentes ou inválidos', { prompts });
      return new Response(
        JSON.stringify({
          error: 'Prompts ausentes ou inválidos',
          isValid: false,
          overallFeedback: "Não foi possível validar: configuração incorreta."
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar a chave da API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Erro: Chave da API Gemini não configurada');
      return new Response(
        JSON.stringify({
          error: 'Configuração da API Gemini ausente',
          isValid: false,
          overallFeedback: "Não foi possível validar: configuração de API ausente."
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Inicializar a API Gemini com tratamento de erros
    let genAI, model;
    try {
      console.log('Inicializando modelo Gemini...');
      genAI = new GoogleGenerativeAI(geminiApiKey);
      model = genAI.getGenerativeModel({ model: "gemini-pro" });
    } catch (initError) {
      console.error('Erro ao inicializar a API Gemini:', initError);
      return new Response(
        JSON.stringify({
          error: 'Falha ao inicializar a API Gemini',
          isValid: false,
          overallFeedback: "Erro técnico na inicialização do serviço de validação."
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extrair informações do prompt
    const prompt = prompts[0];
    const contentType = prompt.type;
    const sectionName = prompt.section || 'conteúdo';

    // Log para debug
    console.log(`Validando conteúdo da seção "${sectionName}"\n`);
    
    // Construir o prompt baseado no tipo de conteúdo
    let promptText;
    if (contentType === 'title') {
      promptText = buildTitlePrompt(content);
    } else {
      promptText = buildContentPrompt(content, sectionName);
    }
    
    // Log do prompt para debug (truncado para não sobrecarregar os logs)
    const truncatedContent = content.length > 100 
      ? content.substring(0, 100) + '...' 
      : content;
    console.log(`Enviando prompt para ${sectionName} com conteúdo: ${truncatedContent}`);

    try {
      // Chamar a API do Gemini com timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao chamar a API do Gemini')), 15000);
      });
      
      const resultPromise = model.generateContent(promptText);
      const result = await Promise.race([resultPromise, timeoutPromise]);
      
      const response = result.response;
      const text = response.text();
      
      // Log da resposta para debug (truncado)
      const truncatedResponse = text.length > 200 
        ? text.substring(0, 200) + '...' 
        : text;
      console.log(`Resposta recebida: ${truncatedResponse}`);
      
      // Tentar extrair JSON da resposta
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Resposta não contém JSON válido');
        }
        
        const jsonString = jsonMatch[0];
        const parsedResponse = JSON.parse(jsonString);
        
        console.log('Resposta processada com sucesso');
        
        // Validar os campos obrigatórios
        if (parsedResponse.isValid === undefined || parsedResponse.overallFeedback === undefined) {
          throw new Error('Resposta incompleta: campos obrigatórios ausentes');
        }
        
        // Enviar resultado
        return new Response(
          JSON.stringify(parsedResponse),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (jsonError) {
        console.error('Erro ao processar JSON da resposta:', jsonError, '\nTexto da resposta:', text);
        
        // Tentar extrair feedback mesmo com erro de parsing
        const feedback = text.includes('feedback') 
          ? text.substring(text.indexOf('feedback') + 10, text.indexOf(',', text.indexOf('feedback')))
          : "Resposta da API em formato inválido";
          
        return new Response(
          JSON.stringify({
            error: 'Erro ao processar resposta',
            rawResponse: truncatedResponse,
            isValid: false,
            overallFeedback: "Erro técnico ao processar a validação. " + feedback
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } catch (apiError) {
      console.error('Erro ao chamar a API do Gemini:', apiError);
      
      // Verificar tipo de erro
      let errorMessage = 'Erro ao processar o conteúdo';
      let statusCode = 500;
      
      // Identificar erros específicos
      if (apiError.message?.includes('API key') || 
          apiError.message?.includes('authentication') || 
          apiError.message?.includes('credentials')) {
        errorMessage = 'Erro de autenticação na API Gemini';
        console.error('Erro de chave API inválida ou expirada');
      } else if (apiError.message?.includes('Timeout')) {
        errorMessage = 'Tempo limite excedido ao chamar a API';
        console.error('Timeout na chamada à API Gemini');
      } else if (apiError.message?.includes('rate limit')) {
        errorMessage = 'Limite de requisições excedido';
        statusCode = 429;
        console.error('Limite de requisições excedido na API Gemini');
      }
      
      return new Response(
        JSON.stringify({
          error: errorMessage,
          isValid: false,
          overallFeedback: `Não foi possível validar devido a um erro técnico: ${errorMessage}`
        }),
        { 
          status: statusCode,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Erro geral na função de validação:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno no servidor',
        isValid: false,
        overallFeedback: "Ocorreu um erro técnico durante a validação."
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Função auxiliar para construir o prompt de título
function buildTitlePrompt(title) {
  const cleanTitle = title.replace(/<[^>]*>/g, '').trim();
  
  return `
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
}

// Função auxiliar para construir o prompt de conteúdo
function buildContentPrompt(content, section) {
  const cleanContent = content.replace(/<[^>]*>/g, '').trim();
  
  return `
    Você é um especialista em textos acadêmicos.
    Analise o seguinte conteúdo da seção "${section}" de um banner acadêmico:
    
    "${cleanContent}"
    
    Critérios de análise:
    1. Clareza e Precisão:
       - O texto deve ser claro e preciso
       - Deve estar adequado para a seção "${section}"
       - Deve utilizar linguagem científica adequada
    
    2. Coesão e Coerência:
       - Verificar se as ideias estão bem conectadas e fazem sentido
    
    3. Aspectos Técnicos:
       - Verificar erros ortográficos e gramaticais
       - Analisar a estrutura das frases
    
    Forneça uma análise detalhada e sugestões de melhoria.
    
    IMPORTANTE: Sua resposta DEVE ser um objeto JSON válido com esta estrutura:
    {
      "isValid": boolean,
      "overallFeedback": "feedback geral em português",
      "details": {
        "strengths": [],
        "weaknesses": [],
        "suggestions": []
      }
    }
  `;
}
