
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const LANGUAGE_TOOL_API = "https://api.languagetool.org/v2/check";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    const params = new URLSearchParams({
      text: text,
      language: 'pt-BR',
      enabledOnly: 'false'
    });

    const response = await fetch(LANGUAGE_TOOL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error('Falha na verificação ortográfica');
    }

    const data = await response.json();
    
    // Converte o formato do LanguageTool para nosso formato
    const suggestions = data.matches.map((match: any) => ({
      word: match.context.text.substring(match.context.offset, match.context.offset + match.context.length),
      type: match.rule.category.id.includes('SPELL') ? 'spelling' : 'grammar',
      suggestions: match.replacements.map((r: any) => r.value),
      message: match.message,
      offset: match.offset,
      length: match.length
    }));

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in spellcheck:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
