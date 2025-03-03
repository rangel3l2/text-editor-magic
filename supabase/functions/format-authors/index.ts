
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

interface FormatAuthorsRequest {
  authors: string;
  sectionName?: string;
}

interface FormatAuthorsResponse {
  formattedAuthors: string;
  originalAuthors: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { authors, sectionName = "Autores" } = await req.json() as FormatAuthorsRequest;

    if (!authors) {
      return new Response(
        JSON.stringify({ error: "Parâmetro authors é obrigatório" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Remover tags HTML
    const cleanAuthors = authors.replace(/<[^>]*>/g, "").trim();

    console.log(`Formatando ${sectionName}:`, cleanAuthors);

    // Instrução específica com base no tipo de autor (docente ou discente)
    let instruction = "";
    if (sectionName === "Docentes") {
      instruction = `Formate corretamente os nomes dos docentes/orientadores a seguir de acordo com as normas ABNT, mantendo as titulações (Prof., Dr., etc.) quando presentes: "${cleanAuthors}". Retorne apenas os nomes formatados, sem explicações adicionais.`;
    } else {
      instruction = `Formate corretamente os nomes dos autores/alunos a seguir de acordo com as normas ABNT: "${cleanAuthors}". Retorne apenas os nomes formatados, sem explicações adicionais.`;
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: instruction,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na API do Gemini:", errorText);
      throw new Error(`Falha na API do Gemini: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error("Formato de resposta inválido da API do Gemini");
    }

    const formattedAuthors = data.candidates[0].content.parts[0].text.trim();
    
    console.log(`${sectionName} formatados:`, formattedAuthors);

    const result: FormatAuthorsResponse = {
      formattedAuthors,
      originalAuthors: cleanAuthors,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro ao formatar autores:", error);
    
    return new Response(
      JSON.stringify({ error: `Erro ao formatar autores: ${error.message}` }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
