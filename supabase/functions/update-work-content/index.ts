
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

interface UpdateWorkContentRequest {
  id: string;
  contentPatch: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json().catch(() => null)) as UpdateWorkContentRequest | null;
    if (!body || !body.id || !body.contentPatch) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load current content
    const { data: work, error: fetchError } = await supabase
      .from('work_in_progress')
      .select('id, user_id, content')
      .eq('id', body.id)
      .maybeSingle();

    if (fetchError) {
      console.error('fetchError:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch work' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!work) {
      return new Response(JSON.stringify({ error: 'Work not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (work.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentContent = (work.content as Record<string, unknown>) || {};
    const newContent = { ...currentContent, ...body.contentPatch } as Record<string, unknown>;

    const { error: updateError } = await supabase
      .from('work_in_progress')
      .update({ content: newContent, last_modified: new Date().toISOString() })
      .eq('id', body.id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('updateError:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update work' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Unexpected error:', e);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
