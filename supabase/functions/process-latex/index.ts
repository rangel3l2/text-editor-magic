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

    const html = `
      <div style="font-family: 'Times New Roman', Times, serif; padding: 20px; text-align: justify;">
        ${latex
          // Handle title
          .replace(/\\begin{center}([\s\S]*?)\\end{center}/g, '<div style="text-align: center;">$1</div>')
          .replace(/\\Large\\textbf{([^}]*)}/g, '<h1 style="font-size: 1.8em; font-weight: bold; margin-bottom: 0.5em; text-align: center;">$1</h1>')
          
          // Handle authors and affiliation
          .replace(/\\begin{flushleft}([\s\S]*?)\\end{flushleft}/g, '<div style="text-align: left; margin-bottom: 1em;">$1</div>')
          .replace(/\\textit{([^}]+)}/g, '<span style="font-style: italic;">$1</span>')
          
          // Handle section titles
          .replace(/\\textbf{([^}]+)}/g, '<h2 style="font-size: 1.4em; font-weight: bold; margin: 1em 0 0.5em 0;">$1</h2>')
          
          // Handle spacing
          .replace(/\\vspace{[^}]+}/g, '<div style="margin: 0.5em 0;"></div>')
          
          // Remove LaTeX document structure
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