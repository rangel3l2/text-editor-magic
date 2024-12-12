import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const mathjaxTypeset = async (latex: string) => {
  const MathJax = await import('https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js');
  
  try {
    const svg = MathJax.tex2svg(latex, {
      display: true,
      em: 16,
      ex: 8,
      containerWidth: 800
    });
    
    return svg.outerHTML;
  } catch (error) {
    console.error('Error processing LaTeX:', error);
    throw new Error('Failed to process LaTeX');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { latex } = await req.json()
    
    if (!latex) {
      return new Response(
        JSON.stringify({ error: 'LaTeX content is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const svg = await mathjaxTypeset(latex)
    
    return new Response(
      JSON.stringify({ svg }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process LaTeX' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})