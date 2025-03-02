
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface RequestBody {
  title: string;
  sectionName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request data
    const requestData: RequestBody = await req.json();
    const { title, sectionName = "Título" } = requestData;

    if (!title || typeof title !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Título não fornecido ou inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Validando ${sectionName}: "${title}"`);

    // Clean title to ensure no HTML tags
    const cleanTitle = title.replace(/<[^>]*>/g, '').trim();

    if (!cleanTitle) {
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          overallFeedback: "O título não pode estar vazio.",
          details: {
            suggestions: ["Adicione um título para o trabalho."]
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine prompt based on section name
    let prompt = '';
    if (sectionName === "Título") {
      prompt = `Avalie o seguinte título para um banner científico:
      
      "${cleanTitle}"
      
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
      // Para outras seções, pode personalizar o prompt
      prompt = `Avalie o seguinte conteúdo para a seção "${sectionName}" de um banner científico:
      
      "${cleanTitle}"
      
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
      }`;
    }

    // Call Gemini API
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
      console.error('Erro na API Gemini:', await response.text());
      throw new Error(`Erro na API do Gemini: ${response.status} ${response.statusText}`);
    }

    const geminiData = await response.json();
    console.log('Resposta bruta do Gemini:', JSON.stringify(geminiData));

    if (!geminiData.candidates || !geminiData.candidates[0]?.content?.parts || !geminiData.candidates[0].content.parts[0]?.text) {
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
    const parsedResponse = JSON.parse(jsonString);

    // Return the validation result
    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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
