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
    const { latexContent } = await req.json()
    
    if (!latexContent) {
      return new Response(
        JSON.stringify({ error: 'LaTeX content is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Received LaTeX content:', latexContent);

    // For now, we'll create a simple HTML preview
    // Later this can be replaced with actual LaTeX to HTML conversion
    const html = `
      <div style="padding: 20px; font-family: 'Times New Roman', serif;">
        ${latexContent
          .replace(/\\title{(.*?)}/, '<h1>$1</h1>')
          .replace(/\\author{(.*?)}/, '<p class="author">$1</p>')
          .replace(/\\section{(.*?)}/g, '<h2>$1</h2>')
          .replace(/\\section\*{(.*?)}/g, '<h2>$1</h2>')
          .replace(/\\begin{document}/, '')
          .replace(/\\end{document}/, '')
          .replace(/\\maketitle/, '')
          .replace(/\\documentclass{article}/, '')
        }
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