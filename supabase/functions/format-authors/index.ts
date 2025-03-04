
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
    if (!requestData || !requestData.authors) {
      return new Response(
        JSON.stringify({ error: "Missing required field: authors" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { authors } = requestData;

    if (!Array.isArray(authors)) {
      return new Response(
        JSON.stringify({ error: "Invalid authors data. Expected an array." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Process authors (simplified formatting logic)
    const formattedAuthors = authors.map((author) => {
      // For now, just return the author as is
      return author;
    });

    // Return formatted authors
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
