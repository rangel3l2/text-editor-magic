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

    // Remove all LaTeX document structure and commands
    let cleanedLatex = latex
      // Remove document class and packages
      .replace(/\\documentclass.*?\\begin{document}/s, '')
      .replace(/\\end{document}/, '')
      .replace(/\\usepackage.*?\n/g, '')
      .replace(/\\geometry{.*?}/s, '')
      
      // Remove specific LaTeX commands while preserving content
      .replace(/\\begin{center}([\s\S]*?)\\end{center}/g, '<div class="text-center">$1</div>')
      .replace(/\\Large\s*{([^}]*)}/g, '<h1 class="text-xl font-bold text-center mb-4">$1</h1>')
      .replace(/\\large\s*{([^}]*)}/g, '<h2 class="text-lg text-center mb-4">$1</h2>')
      .replace(/\\textbf{([^}]*)}/g, '<strong>$1</strong>')
      .replace(/\\textit{([^}]*)}/g, '<em>$1</em>')
      
      // Remove multicols environment completely
      .replace(/\\begin{multicols}{2}[\s\S]*?\\end{multicols}/g, (match) => {
        return match
          .replace(/\\begin{multicols}{2}/g, '')
          .replace(/\\setlength{\\columnsep}{[^}]+}/g, '')
          .replace(/\\columnbreak/g, '')
          .replace(/\\end{multicols}/g, '')
          .trim();
      })
      
      // Remove all remaining LaTeX commands
      .replace(/\\[a-zA-Z]+(\[[^\]]*\])?{([^}]*)}/g, '$2')
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/\\vspace{[^}]+}/g, '')
      .replace(/\\noindent/g, '')
      .replace(/\\{|\\}/g, '')
      .replace(/[{}]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Create the final HTML with proper styling
    const html = `
      <div class="prose max-w-none" style="
        font-family: 'Times New Roman', Times, serif;
        padding: 20mm;
        text-align: justify;
        font-size: 12pt;
        line-height: 1.5;
        column-count: 2;
        column-gap: 10mm;
      ">
        ${cleanedLatex}
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