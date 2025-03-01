
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateTitle } from "../_shared/contentValidator.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Função de validação de título iniciada");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    const { title } = await req.json();
    
    if (!title || typeof title !== 'string') {
      return new Response(
        JSON.stringify({ error: "Título inválido ou não fornecido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Validando título: "${title}"`);
    
    const results = await validateTitle(title);
    console.log(`Enviando resultados da validação: ${JSON.stringify(results, null, 2)}`);
    
    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`Erro ao validar título: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        isValid: true, // Retorna válido em caso de erro técnico
        overallFeedback: `Não foi possível validar o título devido a um erro técnico. Continue escrevendo seguindo as práticas acadêmicas.`,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 // Retornamos 200 para não quebrar a experiência do usuário
      }
    );
  }
});
