
import { corsHeaders } from '../_shared/cors';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    const prompt = `
    Você é um especialista em redação acadêmica. Avalie o seguinte título de trabalho acadêmico e forneça feedback:
    
    Título: "${title}"
    
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
    console.log('Resposta da API do Gemini:', result);
    
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
    console.log(`Tamanho do conteúdo: ${content.length} caracteres`);

    // Usar um prompt mais simples para evitar complexidade excessiva
    const prompt = `
    Você é um especialista em redação acadêmica. Avalie o seguinte texto para a seção "${section}" de um trabalho acadêmico:
    
    "${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}"
    
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
    const { content, prompts } = await req.json();
    console.log('Requisição recebida para validação de conteúdo');
    console.log('Prompts:', prompts);

    // Validar os parâmetros da requisição
    if (!content || !prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Parâmetros inválidos. É necessário fornecer "content" e "prompts".' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    // Processar cada prompt
    let results;
    for (const prompt of prompts) {
      if (prompt.type === 'title') {
        results = await validateTitle(content);
      } else if (prompt.type === 'content' && prompt.section) {
        results = await validateContent(content, prompt.section);
      }
    }

    // Se nenhum tipo de validação foi processado
    if (!results) {
      return new Response(
        JSON.stringify({ 
          error: 'Tipo de validação não suportado.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

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
        error: 'Erro interno do servidor ao processar a validação.', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
