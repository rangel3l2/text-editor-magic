
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Você é um revisor de texto em português do Brasil. Analise o texto abaixo e retorne apenas um array JSON com os erros ortográficos e gramaticais encontrados. Para cada erro, inclua:
    - a palavra com erro
    - o tipo de erro (ortográfico ou gramatical)
    - uma lista de sugestões de correção
    
    Texto para análise:
    ${text}
    
    Retorne apenas o array JSON, sem nenhum outro texto.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const suggestions = JSON.parse(response.text());

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
