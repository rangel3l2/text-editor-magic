
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight request
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const { authors } = await req.json();

    if (!authors || !Array.isArray(authors)) {
      return new Response(
        JSON.stringify({ error: "Invalid authors data. Expected an array." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Process authors (this is a placeholder for your actual processing logic)
    const formattedAuthors = authors.map((author: any) => {
      // Your author formatting logic here
      // For now, just return the author as is
      return author;
    });

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
