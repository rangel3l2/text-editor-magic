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
      throw new Error('Authors text is required');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Format the following text according to these exact ABNT rules:

      1. For student authors (Discente):
         - Surname in UPPERCASE, followed by comma and first name
         - Replace "Autores:" with "Discente:"
         - For more than two authors, use "et al."
         - Separate multiple authors with semicolon and space
         Example: SILVA, João; SANTOS, Maria et al.

      2. For advisor/professor (Docente):
         - Replace any existing "Orientador:" or similar with "Docente:"
         - Include academic title (Dr., Prof., etc.) if present
         - Format name same as students: SURNAME, First Name
         Example: Docente: Dr. SILVA, João

      Important rules:
      - Keep any HTML formatting if present
      - Keep affiliation and email information unchanged
      - Format each section separately
      - Return only the formatted text, no explanations
      
      Text to format:
      "${authors}"
    `;

    console.log('Original authors:', authors);
    const result = await model.generateContent(prompt);
    const formattedAuthors = result.response.text().trim();
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
      JSON.stringify({ 
        error: 'Failed to format authors',
        details: error.message 
      }),
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