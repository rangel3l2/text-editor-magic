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
      Format the following text into two separate sections according to these exact ABNT rules:

      1. Student authors section:
         - Create a new section for students without any label
         - Format each name: SURNAME in UPPERCASE, followed by comma and first name
         - For more than two authors, use "et al."
         - Separate multiple authors with semicolon and space
         Example: SILVA, João; SANTOS, Maria et al.

      2. Advisor section:
         - Create a new section for advisors without any label
         - Include academic title (Dr., Prof., etc.) if present
         - Format name: SURNAME in UPPERCASE, followed by comma and first name
         Example: Dr. SILVA, João Bispo

      Important rules:
      - Remove any "Autores:", "Discente:", or "Docente:" labels
      - Keep HTML formatting if present
      - Keep affiliation and email information unchanged
      - Create two distinct sections separated by a line break
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