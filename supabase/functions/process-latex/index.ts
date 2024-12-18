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

    // Extract content sections while preserving LaTeX structure
    const contentSections = {
      institution: latex.match(/\\begin{center}([\s\S]*?)\\end{center}/),
      title: latex.match(/\\textbf{([^}]*)}/),
      authors: latex.match(/\\fontsize{12pt}{14pt}\\selectfont\s*([^\\]*)/),
      content: latex.match(/\\begin{multicols}{2}([\s\S]*?)\\end{multicols}/)
    };

    let html = '<div style="max-width: 100%; margin: 0 auto;">';

    // Add institution section if it exists
    if (contentSections.institution?.[1]?.trim()) {
      const institutionContent = contentSections.institution[1]
        .replace(/\\includegraphics\[.*?\]{([^}]*)}/g, (match, src) => 
          `<img src="${src}" style="height: 2cm; margin: 0 auto 0.5cm; display: block;" />`
        )
        .replace(/\\fontsize{12pt}{14pt}\\selectfont\s*(.*)/g, '$1')
        .trim();
      
      if (institutionContent) {
        html += `<div style="text-align: center; font-size: 12pt; margin-bottom: 1cm;">${institutionContent}</div>`;
      }
    }

    // Add title if it exists
    if (contentSections.title?.[1]?.trim()) {
      html += `<h1 style="font-size: 16pt; font-weight: bold; text-align: center; margin: 0 0 0.5cm;">${contentSections.title[1]}</h1>`;
    }

    // Add authors if they exist
    if (contentSections.authors?.[1]?.trim()) {
      html += `<div style="font-size: 12pt; text-align: center; margin: 0 0 1cm;">${contentSections.authors[1]}</div>`;
    }

    // Process main content if it exists
    if (contentSections.content?.[1]?.trim()) {
      const mainContent = contentSections.content[1]
        .replace(/\\noindent{\\fontsize{14pt}{16pt}\\selectfont\\textbf{([^}]+)}}/g, 
          '<h3 style="font-size: 14pt; font-weight: bold; margin: 1em 0 0.5em;">$1</h3>')
        .replace(/\\fontsize{12pt}{14pt}\\selectfont\s*(.*?)(?=\\|$)/gs, 
          '<p style="font-size: 12pt; margin: 0 0 0.5em;">$1</p>')
        .replace(/\\vspace{[^}]+}/g, '<div style="margin: 1em 0;"></div>')
        .replace(/\\[a-zA-Z]+(\[[^\]]*\])?{([^}]*)}/g, '$2')
        .replace(/\\[a-zA-Z]+/g, '')
        .replace(/[{}]/g, '')
        .trim();

      if (mainContent) {
        html += mainContent;
      }
    }

    html += '</div>';

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