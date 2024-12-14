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
        padding: 0; 
        text-align: justify; 
        font-size: 12pt;
        line-height: 1.5;
      ">
        ${latex
          // Handle title and institution
          .replace(/\\begin{center}([\s\S]*?)\\end{center}/g, '<div style="text-align: center; margin-bottom: 1em;">$1</div>')
          .replace(/\\Large\s*{([^}]*)}/g, '<h1 style="font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 1em;">$1</h1>')
          .replace(/\\large\s*{([^}]*)}/g, '<h2 style="font-size: 14pt; text-align: center; margin-bottom: 1em;">$1</h2>')
          
          // Handle sections
          .replace(/\\noindent\\textbf{([^}]+)}/g, '<h3 style="font-size: 12pt; font-weight: bold; margin: 1em 0 0.5em 0;">$1</h3>')
          
          // Handle spacing and structure
          .replace(/\\vspace{[^}]+}/g, '<div style="margin: 0.5em 0;"></div>')
          .replace(/\\begin{multicols}{2}[\s\S]*?\\end{multicols}/g, '$1')
          .replace(/\\setlength{\\columnsep}{[^}]+}/g, '')
          
          // Remove remaining LaTeX commands
          .replace(/\\[a-zA-Z]+(\[[^\]]*\])?{([^}]*)}/g, '$2')
          .replace(/\\[a-zA-Z]+/g, '')
          .replace(/[{}]/g, '')
          
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