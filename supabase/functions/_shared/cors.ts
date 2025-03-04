
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, content-length, x-forwarded-for',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Helper function to handle CORS preflight requests
export function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204, // Using 204 No Content for OPTIONS
      headers: corsHeaders
    });
  }
  return null;
}
