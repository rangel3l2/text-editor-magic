import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
      throw new Error('Authors text is required');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Format the following text according to ABNT standards following these exact rules:

      1. For a single author:
      Format: SOBRENOME, Nome.
      Example: MEDEIROS, João Bosco.

      2. For two or three authors:
      Format: SOBRENOME, Nome; SOBRENOME, Nome; SOBRENOME, Nome.
      Example: SILVA, Antônio Carlos; SOUZA, Maria Clara; PEREIRA, João.

      3. For more than three authors:
      Format: SOBRENOME, Nome et al.
      Example: FERREIRA, José Luís et al.

      Important:
      - Keep any HTML formatting if present
      - Keep affiliation and email information unchanged
      - Replace "Autores:" with "Discente:" for student authors and "Docente:" for professor authors
      - Format each section separately following the ABNT rules
      - Only format the author names, not other information
      - Return only the formatted text, no explanations
      
      Text to format:
      "${authors}"
    `;

    const result = await model.generateContent(prompt);
    const formattedAuthors = result.response.text().trim();

    console.log('Original authors:', authors);
    console.log('Formatted authors:', formattedAuthors);

    return new Response(
      JSON.stringify({ formattedAuthors }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error formatting authors:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to format authors' }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});