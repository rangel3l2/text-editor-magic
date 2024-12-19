import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      // Skip if it's already in the correct format or contains "Dr." or "Prof."
      if (name.includes('Dr.') || name.includes('Prof.')) {
        return name.trim()
      }

      // Split the name into parts
      const parts = name.split(' ')
      if (parts.length < 2) return name.toUpperCase()

      // Get the last name and the rest
      const lastName = parts.pop()
      const firstNames = parts.join(' ')

      // Format according to ABNT: LASTNAME, FirstNames
      return `${lastName.toUpperCase()}, ${firstNames}`
    })

    // If there are more than 2 names for students, use "et al."
    let formattedAuthors = ''
    if (formattedNames.length > 2) {
      formattedAuthors = `${formattedNames[0]}; ${formattedNames[1]} et al.`
    } else {
      formattedAuthors = formattedNames.join('; ')
    }

    // Add line break before advisors if they exist
    if (cleanText.includes('Dr.') || cleanText.includes('Prof.')) {
      const advisors = namesList
        .filter(name => name.includes('Dr.') || name.includes('Prof.'))
        .join('; ')
      formattedAuthors += `\n\n${advisors}`
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