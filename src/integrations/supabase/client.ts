// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = "https://xevbmqbwdaqdfexhmbmu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldmJtcWJ3ZGFxZGZleGhtYm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzODk0MTMsImV4cCI6MjA0Nzk2NTQxM30.rB31otfyrrahIGI7lmBcEH4QPENqbX59q0Flpm6E_mY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);