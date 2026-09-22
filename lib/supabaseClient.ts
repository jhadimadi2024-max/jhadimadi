import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase permanent fallback credentials
const SUPABASE_URL =
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.NEXT_PUBLIC_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_URL || (import.meta.env as any)?.NEXT_PUBLIC_SUPABASE_URL)) ||
  'https://dwhsqftllkximhfvwqak.supabase.co';

const rawKey =
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY)) ||
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_ANON_KEY || (import.meta.env as any)?.NEXT_PUBLIC_SUPABASE_ANON_KEY)) ||
  '';

// Clean Legacy Anon JWT Key literal string
const LITERAL_KEY = 'eyJhGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHNxZnRsbGt4aW1oZnZ3cWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzAyNzEsImV4cCI6MjEwNTMwNjI3MX0.GbceleQmKhRfSzE-c_Bq3fh-YA7I4oZI1fGCsU-SaPI';

const cleanRawKey = (rawKey && typeof rawKey === 'string')
  ? rawKey.trim().replace(/[)\s'"`;]+$/, '').replace(/[^a-zA-Z0-9_\-.]/g, '')
  : '';

let resolvedKey = cleanRawKey || LITERAL_KEY;
if (resolvedKey.startsWith('eyJhGci')) {
  resolvedKey = resolvedKey.replace(/^eyJhGci/, 'eyJhbGci');
}

const SUPABASE_ANON_KEY = resolvedKey;

// Direct initialization with graceful hardcoded fallback
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
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
