
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Função de formatação de autores iniciada");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    const { authors } = await req.json();
    
    if (!authors || !Array.isArray(authors)) {
      return new Response(
        JSON.stringify({ error: "Lista de autores inválida ou não fornecida" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Implementação simplificada para exemplo
    const formattedAuthors = authors.map(author => {
      if (typeof author === 'string') {
        return { name: author, formatted: author.toUpperCase() };
      }
      return { name: author.name, formatted: author.name.toUpperCase() };
    });

    return new Response(
      JSON.stringify({ formattedAuthors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`Erro na formatação de autores: ${error.message}`);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
