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
    const { content } = await req.json()
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'LaTeX content is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Placeholder: Convert content to HTML preview
    // In a real implementation, this would use a LaTeX to HTML converter
    const html = `
      <div class="preview">
        <h1>${content.title || ''}</h1>
        <p>${content.authors || ''}</p>
        <div>${content.introduction || ''}</div>
        <div>${content.objectives || ''}</div>
        <div>${content.methodology || ''}</div>
        <div>${content.results || ''}</div>
        <div>${content.conclusion || ''}</div>
        <div>${content.references || ''}</div>
        <div>${content.acknowledgments || ''}</div>
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