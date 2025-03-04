
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight request
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Check content type
    if (req.headers.get("content-type") !== "application/json") {
      return new Response(
        JSON.stringify({ error: "Expected content-type: application/json" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const requestData = await req.json().catch(() => null);
    
    // Validate input
    if (!requestData) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle authors as string or array
    let authors;
    if (typeof requestData.authors === 'string') {
      // If authors is a string (from RichTextEditor), treat it as a single entry
      authors = [requestData.authors];
    } else if (Array.isArray(requestData.authors)) {
      // If authors is already an array, use it as is
      authors = requestData.authors;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid authors format. Expected a string or an array." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("Processing authors:", authors);

    // Return formatted authors (just the same content for now)
    const formattedAuthors = typeof requestData.authors === 'string' 
      ? requestData.authors  // Return original string if input was a string
      : authors;             // Return array if input was an array

    return new Response(
      JSON.stringify({ formattedAuthors }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error formatting authors:", error);
    
    return new Response(
      JSON.stringify({ error: `Failed to format authors: ${error.message}` }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
