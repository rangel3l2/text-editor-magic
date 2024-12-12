import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Here we would normally send the LaTeX to a service for rendering
    // For now, we'll create a simple HTML representation
    const html = `
      <div style="font-family: 'Times New Roman', Times, serif; padding: 20px;">
        ${latex
          .replace(/\\section\*{([^}]+)}/g, '<h2 style="font-size: 1.2em; margin: 1em 0;">$1</h2>')
          .replace(/\\begin{center}([\s\S]*?)\\end{center}/g, '<div style="text-align: center;">$1</div>')
          .replace(/\\Large\\textbf{([^}]*)}/g, '<h1 style="font-size: 1.5em; font-weight: bold;">$1</h1>')
          .replace(/\\normalsize/g, '<div style="font-size: 1em;">')
          .replace(/\\vspace{[^}]+}/g, '<div style="margin: 1em 0;"></div>')
          .replace(/\\documentclass.*?\\begin{document}/s, '')
          .replace(/\\end{document}/, '')
          .replace(/\\usepackage.*?\n/g, '')
          .replace(/\\geometry{.*?}/s, '')
          .trim()}
      </div>
    `;

    return new Response(
      JSON.stringify({ html }),
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