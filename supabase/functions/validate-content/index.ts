
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.1.3';

// Criação do cliente Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração da API do Gemini
const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? 'AIzaSyD1MOJwy4aj91ZThQsOplN-DQfKHz9DN88';
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Interface para o resultado da validação
interface ValidationResult {
  isValid: boolean;
  overallFeedback: string;
  details?: {
    spelling?: any[];
    grammar?: any[];
    clarity?: any[];
    suggestions?: string[];
  };
}

// Função para validar um título
async function validateTitle(title: string): Promise<ValidationResult> {
  if (!title || title.trim().length < 5) {
    return {
      isValid: false,
      overallFeedback: "O título é muito curto. Por favor, forneça um título mais descritivo."
    };
  }

  try {
    console.log('Validando título:', title);
    // Limpar o título de tags HTML
    const cleanTitle = title.replace(/<[^>]*>/g, '').trim();

    const prompt = `
    Você é um especialista em redação acadêmica. Avalie o seguinte título de trabalho acadêmico e forneça feedback:
    
    Título: "${cleanTitle}"
    
    Analise os seguintes aspectos e forneça uma resposta APENAS em formato JSON:
    1. Se o título é claro e específico
    2. Se o título representa adequadamente um trabalho acadêmico
    3. Se há erros gramaticais ou de formatação
    
    Formato da resposta JSON:
    {
      "isValid": boolean,
      "overallFeedback": "feedback geral em português",
      "details": {
        "suggestions": ["sugestão 1", "sugestão 2"]
      }
    }
    `;

    const result = await model.generateContent(prompt);
    console.log('Resposta da API do Gemini recebida');
    
    const resultText = result.response.text();
    // Extrair apenas o JSON da resposta
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const validationResult = JSON.parse(jsonMatch[0]) as ValidationResult;
      return validationResult;
    } else {
      console.error('Formato de resposta inesperado:', resultText);
      return {
        isValid: true,
        overallFeedback: "O título parece adequado, mas não foi possível realizar uma análise detalhada."
      };
    }
  } catch (error) {
    console.error('Erro ao validar título:', error);
    return {
      isValid: true,
      overallFeedback: "Não foi possível validar o título devido a um erro técnico. Considere as práticas recomendadas para títulos acadêmicos."
    };
  }
}

// Função para validar o conteúdo de uma seção
async function validateContent(content: string, section: string): Promise<ValidationResult> {
  if (!content || content.trim().length < 20) {
    return {
      isValid: false,
      overallFeedback: `O conteúdo da seção "${section}" é muito curto. Por favor, desenvolva mais o texto.`
    };
  }

  try {
    console.log(`Validando conteúdo da seção "${section}"`);
    // Limpar o conteúdo de tags HTML
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    console.log(`Tamanho do conteúdo limpo: ${cleanContent.length} caracteres`);

    // Usar um prompt mais simples para evitar complexidade excessiva
    const prompt = `
    Você é um especialista em redação acadêmica. Avalie o seguinte texto para a seção "${section}" de um trabalho acadêmico:
    
    "${cleanContent.substring(0, 1000)}${cleanContent.length > 1000 ? '...' : ''}"
    
    Forneça uma resposta APENAS em formato JSON seguindo o modelo:
    {
      "isValid": true,
      "overallFeedback": "O texto está bem estruturado e adequado para uma seção acadêmica."
    }
    
    Se encontrar problemas, retorne:
    {
      "isValid": false,
      "overallFeedback": "Feedback específico sobre os problemas encontrados."
    }
    `;

    const result = await model.generateContent(prompt);
    console.log('Resposta recebida da API');
    
    const resultText = result.response.text();
    // Extrair apenas o JSON da resposta
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const validationResult = JSON.parse(jsonMatch[0]) as ValidationResult;
      return validationResult;
    } else {
      console.error('Formato de resposta inesperado:', resultText);
      return {
        isValid: true,
        overallFeedback: `O conteúdo da seção "${section}" parece adequado, mas não foi possível realizar uma análise detalhada.`
      };
    }
  } catch (error) {
    console.error(`Erro ao validar conteúdo da seção "${section}":`, error);
    return {
      isValid: true,
      overallFeedback: `Não foi possível validar o conteúdo da seção "${section}" devido a um erro técnico. Continue escrevendo seguindo as práticas acadêmicas.`
    };
  }
}

Deno.serve(async (req) => {
  // Verificar o método da requisição
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Solicitação recebida em validate-content:', req.method);
    
    // Tentar verificar se há conteúdo no corpo
    let body;
    try {
      body = await req.json();
      console.log('Corpo da requisição analizado com sucesso');
    } catch (error) {
      console.error('Erro ao analisar o corpo da requisição:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Não foi possível analisar o corpo da requisição. Certifique-se de enviar um JSON válido.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    const { content, prompts } = body;
    
    // Validação mais tolerante dos parâmetros
    if (!content) {
      console.error('Parâmetro content não fornecido ou vazio');
      return new Response(
        JSON.stringify({ 
          error: 'O parâmetro "content" é obrigatório.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    // Se prompts não for fornecido ou não for um array, crie um array padrão para section
    const validPrompts = Array.isArray(prompts) && prompts.length > 0 
      ? prompts 
      : [{ type: 'content', section: 'texto' }];
    
    console.log('Prompts validados:', validPrompts);

    // Processar cada prompt
    let results;
    for (const prompt of validPrompts) {
      if (prompt.type === 'title') {
        results = await validateTitle(content);
      } else if (prompt.type === 'content') {
        const section = prompt.section || 'texto';
        results = await validateContent(content, section);
      }
    }

    // Se nenhum tipo de validação foi processado
    if (!results) {
      results = {
        isValid: true,
        overallFeedback: "Não foi possível realizar uma análise específica. O texto parece adequado em geral."
      };
    }

    console.log('Enviando resultados da validação:', results);
    return new Response(
      JSON.stringify(results),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    
    return new Response(
      JSON.stringify({ 
        isValid: true,
        overallFeedback: "Ocorreu um erro técnico durante a validação, mas você pode continuar escrevendo."
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
