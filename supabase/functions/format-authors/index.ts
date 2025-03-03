
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { rateLimit } from "../_shared/rateLimiter.ts";

interface FormatAuthorsRequest {
  authors: string;
  sectionName: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 // Ensure OPTIONS returns 200 OK
    });
  }

  try {
    // Implement rate limiting
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await rateLimit(clientIP, "format-authors");
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: `Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.timeRemaining / 1000)} seconds.` 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    // Extract authors from request body
    const { authors, sectionName } = await req.json() as FormatAuthorsRequest;

    // Validate parameters
    if (!authors) {
      return new Response(
        JSON.stringify({ error: "Parameter authors is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Clean HTML tags
    const cleanAuthors = authors.replace(/<[^>]*>/g, "").trim();
    
    // Format authors according to ABNT rules
    // This is a simplified formatter, you might want to implement a more sophisticated one
    const names = cleanAuthors.split(/[,;]|\s+e\s+|\s+and\s+/).map(name => name.trim()).filter(Boolean);
    
    let formattedAuthors = "";
    
    if (sectionName.toLowerCase().includes("docente")) {
      // Format for advisors - include their titles
      formattedAuthors = names.map(name => {
        // Check if name already has a title
        if (/(Prof|Dr|Ma|Me|Esp|PhD)\.?\s/.test(name)) {
          return name;
        }
        // Add Prof. title if not present
        return `Prof. ${name}`;
      }).join("; ");
    } else {
      // Format for students - LASTNAME, Firstname
      formattedAuthors = names.map(name => {
        const parts = name.trim().split(/\s+/);
        if (parts.length <= 1) return name;
        
        const lastname = parts.pop()?.toUpperCase();
        const firstname = parts.join(" ");
        return `${lastname}, ${firstname}`;
      }).join("; ");
    }

    return new Response(
      JSON.stringify({ formattedAuthors }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error during author formatting:", error);
    
    return new Response(
      JSON.stringify({ error: `Error during author formatting: ${error.message}` }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
