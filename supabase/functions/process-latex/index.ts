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
      <div style="
        font-family: 'Times New Roman', Times, serif; 
        padding: 2.5cm; 
        text-align: justify; 
        column-count: 2; 
        column-gap: 1cm; 
        line-height: 1.5;
        font-size: 12pt;
      ">
        ${latex
          // Handle title
          .replace(/\\begin{center}([\s\S]*?)\\end{center}/g, '<h1 style="text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 1em; column-span: all;">$1</h1>')
          .replace(/\\Large\\textbf{([^}]*)}/g, '<h1 style="text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 1em; column-span: all;">$1</h1>')
          
          // Handle authors and affiliation
          .replace(/\\begin{flushleft}([\s\S]*?)\\end{flushleft}/g, '<div style="text-align: left; margin-bottom: 2em; column-span: all;">$1</div>')
          .replace(/\\textit{([^}]+)}/g, '<em>$1</em>')
          
          // Handle section titles
          .replace(/\\textbf{([0-9]+\.\s*[^}]+)}/g, '<h2 style="font-size: 12pt; font-weight: bold; margin: 1em 0 0.5em 0; text-transform: uppercase;">$1</h2>')
          
          // Handle spacing
          .replace(/\\vspace{[^}]+}/g, '<div style="margin: 1em 0;"></div>')
          
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