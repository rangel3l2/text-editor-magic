import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xevbmqbwdaqdfexhmbmu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhldmJtcWJ3ZGFxZGZleGhtYm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzODk0MTMsImV4cCI6MjA0Nzk2NTQxM30.rB31otfyrrahIGI7lmBcEH4QPENqbX59q0Flpm6E_mY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});