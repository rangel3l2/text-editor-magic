import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xevbmqbwdaqdfexhmbmu.supabase.co';
const supabaseKey = 'your-supabase-key'; // replace with your actual Supabase key

export const supabase = createClient(supabaseUrl, supabaseKey);
