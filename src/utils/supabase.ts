import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseKey, supabase as mainSupabase } from '../supabase';

const SUPABASE_URL = supabaseUrl;
const SUPABASE_ANON_KEY = supabaseKey;

export const supabase: SupabaseClient = (mainSupabase as SupabaseClient) || createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-dwhsqftllkximhfvwqak-auth-token',
    },
    global: {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    },
  }
);

export default supabase;

