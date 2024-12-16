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

    // Remove LaTeX document structure and packages
    let cleanedLatex = latex
      .replace(/\\documentclass.*?\\begin{document}/s, '')
      .replace(/\\end{document}/, '')
      .replace(/\\usepackage.*?\n/g, '')
      .replace(/\\geometry{.*?}/s, '')

    // Only show content if it's not empty
    const contentSections = {
      institution: cleanedLatex.match(/\\begin{center}([\s\S]*?)\\end{center}/),
      title: cleanedLatex.match(/\\Large\s*{([^}]*)}/),
      authors: cleanedLatex.match(/\\large\s*{([^}]*)}/),
      content: cleanedLatex.match(/\\begin{multicols}{2}([\s\S]*?)\\end{multicols}/)
    };

    let html = '<div style="font-family: \'Times New Roman\', Times, serif; padding: 3cm 3cm 2cm 3cm; text-align: justify; font-size: 12pt; line-height: 1.5;">';

    // Only add sections that have content
    if (contentSections.institution?.[1]?.trim()) {
      html += `<div style="text-align: center; font-size: 11pt; margin-bottom: 0.5em;">${contentSections.institution[1]}</div>`;
    }

    if (contentSections.title?.[1]?.trim()) {
      html += `<h1 style="font-size: 14pt; font-weight: bold; text-align: center; margin: 1em 0 0.5em 0;">${contentSections.title[1]}</h1>`;
    }

    if (contentSections.authors?.[1]?.trim()) {
      html += `<h2 style="font-size: 11pt; text-align: center; margin: 0.5em 0;">${contentSections.authors[1]}</h2>`;
    }

    if (contentSections.content?.[1]?.trim()) {
      const cleanContent = contentSections.content[1]
        .replace(/\\noindent\\textbf{([^}]+)}/g, '<h3 style="font-size: 12pt; font-weight: bold; margin: 1em 0 0.5em 0;">$1</h3>')
        .replace(/\\[a-zA-Z]+(\[[^\]]*\])?{([^}]*)}/g, '$2')
        .replace(/\\[a-zA-Z]+/g, '')
        .replace(/[{}]/g, '')
        .trim();

      if (cleanContent) {
        html += `<div style="column-count: 2; column-gap: 1cm;">${cleanContent}</div>`;
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