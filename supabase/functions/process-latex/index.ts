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
      title: latex.match(/\\Large\s*{([^}]*)}/),
      authors: latex.match(/\\large\s*{([^}]*)}/),
      content: latex.match(/\\begin{multicols}{2}([\s\S]*?)\\end{multicols}/)
    };

    let html = '';

    // Add institution section if it exists
    if (contentSections.institution?.[1]?.trim()) {
      const institutionContent = contentSections.institution[1]
        .replace(/\\includegraphics\[.*?\]{([^}]*)}/g, (match, src) => 
          `<img src="${src}" style="max-width: 200px; margin: 0 auto 1.5em; display: block;" />`
        )
        .replace(/\\large\s*{([^}]*)}/g, '$1')
        .trim();
      
      if (institutionContent) {
        html += `<div style="text-align: center; font-size: 11pt; margin-bottom: 2em;">${institutionContent}</div>`;
      }
    }

    // Add title if it exists
    if (contentSections.title?.[1]?.trim()) {
      html += `<h1 style="font-size: 14pt; font-weight: bold; text-align: center; margin: 1em 0;">${contentSections.title[1]}</h1>`;
    }

    // Add authors if they exist
    if (contentSections.authors?.[1]?.trim()) {
      html += `<div style="font-size: 11pt; text-align: center; margin: 1em 0 2em;">${contentSections.authors[1]}</div>`;
    }

    // Process main content if it exists
    if (contentSections.content?.[1]?.trim()) {
      const mainContent = contentSections.content[1]
        .replace(/\\noindent\\textbf{([^}]+)}/g, '<h3 style="font-size: 12pt; font-weight: bold; margin: 1.5em 0 1em;">$1</h3>')
        .replace(/\\vspace{[^}]+}/g, '<div style="margin: 1em 0;"></div>')
        .replace(/\\[a-zA-Z]+(\[[^\]]*\])?{([^}]*)}/g, '$2')
        .replace(/\\[a-zA-Z]+/g, '')
        .replace(/[{}]/g, '')
        .trim();

      if (mainContent) {
        html += mainContent;
      }
    }

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