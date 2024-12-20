import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { authors } = await req.json()
    
    // Remove HTML tags and trim whitespace
    const cleanText = authors.replace(/<[^>]*>/g, '').trim()
    
    // Split the text by common delimiters
    const namesList = cleanText.split(/[,;\n]/)
      .map(name => name.trim())
      .filter(name => name.length > 0)

    // Format each name according to ABNT rules
    let formattedNames = namesList.map(name => {
      // Check if it's a professor (contains Dr., Prof., etc.)
      const isProfessor = name.includes('Dr.') || name.includes('Prof.')
      
      if (isProfessor) {
        // For professors, keep the title and format the name
        const titleMatch = name.match(/(Dr\.|Prof\.)\s+(.+)/)
        if (titleMatch) {
          const [, title, fullName] = titleMatch
          const parts = fullName.split(' ')
          if (parts.length < 2) return name
          
          const lastName = parts.pop()
          const firstNames = parts.join(' ')
          return `${title} ${lastName.toUpperCase()}, ${firstNames}`
        }
        return name
      }

      // For students, format without titles
      const parts = name.split(' ')
      if (parts.length < 2) return name.toUpperCase()

      const lastName = parts.pop()
      const firstNames = parts.join(' ')
      return `${lastName.toUpperCase()}, ${firstNames}`
    })

    // ABNT formatting for multiple authors:
    // - If 1-2 authors: show all
    // - If 3+ authors: show first two followed by "et al."
    let formattedAuthors = ''
    if (formattedNames.length > 2) {
      formattedAuthors = `${formattedNames[0]}; ${formattedNames[1]} et al.`
    } else {
      formattedAuthors = formattedNames.join('; ')
    }

    console.log('Formatted authors:', formattedAuthors)

    return new Response(
      JSON.stringify({ formattedAuthors }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error formatting authors:', error)
    return new Response(
      JSON.stringify({ error: 'Error formatting authors' }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  }
})
