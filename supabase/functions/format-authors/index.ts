import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { authors } = await req.json();

    if (!authors) {
      return new Response(
        JSON.stringify({ error: 'Authors text is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Formate os nomes dos autores de acordo com as normas ABNT:
      - Se houver mais de 2 autores, use "et al." após o primeiro autor
      - Mantenha as informações de afiliação e e-mail
      - Não altere outras informações além dos nomes dos autores
      - Retorne apenas o texto formatado, sem explicações

      Texto original dos autores:
      "${authors}"
    `;

    const result = await model.generateContent(prompt);
    const formattedAuthors = result.response.text().trim();

    return new Response(
      JSON.stringify({ formattedAuthors }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to format authors' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});