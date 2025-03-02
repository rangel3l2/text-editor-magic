
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface PromptConfig {
  type: 'title' | 'content';
  section?: string;
  sectionName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, prompts, sectionName } = await req.json();
    
    if (!content || !prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Conteúdo ou prompts não fornecidos corretamente' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Use the first prompt configuration
    const promptConfig: PromptConfig = prompts[0];
    const resolvedSectionName = sectionName || promptConfig.section || promptConfig.sectionName || 'Conteúdo';
    
    console.log(`Validando seção: ${resolvedSectionName}`);
    console.log(`Tipo de prompt: ${promptConfig.type}`);
    console.log(`Tamanho do conteúdo: ${content.length} caracteres`);

    // Construir o prompt com base no tipo e seção
    let prompt = '';
    if (promptConfig.type === 'title') {
      prompt = `Avalie o seguinte título para um banner científico:
      
      "${content}"
      
      Você deve analisar se o título é:
      1. Claro e conciso
      2. Relevante para um banner científico/acadêmico
      3. Livre de erros ortográficos e gramaticais
      4. Adequado em extensão (nem muito curto nem muito longo)
      
      Retorne somente um JSON com o seguinte formato:
      {
        "isValid": boolean,
        "overallFeedback": "Feedback geral sobre o título",
        "details": {
          "spellingErrors": ["erro1", "erro2"],
          "coherenceIssues": ["problema1", "problema2"],
          "suggestions": ["sugestão1", "sugestão2"],
          "improvedVersions": ["versão melhorada1", "versão melhorada2"]
        }
      }
      
      Se o título for adequado, retorne isValid: true e um feedback positivo, sem detalhes.
      Se não for adequado, retorne isValid: false, feedback construtivo e detalhes específicos.`;
    } else {
      prompt = `Avalie o seguinte conteúdo para a seção "${resolvedSectionName}" de um banner científico:
      
      "${content}"
      
      Avalie se o conteúdo:
      1. É adequado para a seção ${resolvedSectionName}
      2. Está claro e coerente
      3. Contém informações relevantes e precisas
      4. Está livre de erros ortográficos e gramaticais
      5. Segue as normas acadêmicas
      
      Retorne somente um JSON com o seguinte formato:
      {
        "isValid": boolean,
        "overallFeedback": "Feedback geral sobre o conteúdo",
        "details": {
          "spellingErrors": ["erro1", "erro2"],
          "coherenceIssues": ["problema1", "problema2"],
          "suggestions": ["sugestão1", "sugestão2"],
          "improvedVersions": ["versão melhorada1", "versão melhorada2"]
        }
      }
      
      Se o conteúdo for adequado, retorne isValid: true e um feedback positivo, sem detalhes.
      Se não for adequado, retorne isValid: false, feedback construtivo e detalhes específicos.`;
    }

    console.log("Enviando solicitação para a API Gemini");
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      console.error(`Erro na API Gemini: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Detalhes do erro:', errorText);
      throw new Error(`Erro na API do Gemini: ${response.status} ${response.statusText}`);
    }

    const geminiData = await response.json();
    
    if (!geminiData.candidates || !geminiData.candidates[0]?.content?.parts || !geminiData.candidates[0].content.parts[0]?.text) {
      console.error('Formato de resposta inválido:', JSON.stringify(geminiData));
      throw new Error('Formato de resposta inválido da API Gemini');
    }

    // Extract the JSON from the text response
    const responseText = geminiData.candidates[0].content.parts[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('Não foi possível extrair JSON da resposta:', responseText);
      throw new Error('Formato de resposta inválido da API Gemini');
    }
    
    const jsonString = jsonMatch[0];
    
    try {
      const parsedResponse = JSON.parse(jsonString);
      console.log('Resposta da validação processada com sucesso');
      
      return new Response(
        JSON.stringify(parsedResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Erro ao analisar JSON da resposta:', parseError);
      console.error('Texto que causou o erro:', jsonString);
      throw new Error('Erro ao analisar a resposta da API Gemini');
    }

  } catch (error) {
    console.error('Erro durante a validação:', error);
    
    return new Response(
      JSON.stringify({ 
        error: `Erro durante a validação: ${error.message}`,
        isValid: false,
        overallFeedback: "Ocorreu um erro ao validar o conteúdo. Por favor, tente novamente mais tarde." 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
