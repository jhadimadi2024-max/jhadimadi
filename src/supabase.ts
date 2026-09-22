import { createClient } from '@supabase/supabase-js';
import { clearBrowserResidualStorage } from './utils/clearBrowserResiduals';

// Master Credentials - Synced from jhadimadi2024-max/jhadimadi-v2
export const MASTER_SUPABASE_URL = 'https://dwhsqftllkximhfvwqak.supabase.co';
export const MASTER_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHNxZnRsbGt4aW1oZnZ3cWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzAyNzEsImV4cCI6MjEwNTMwNjI3MX0.GbceleQmKhRfSzE-c_Bq3fh-YA7I4oZI1fGCsU-SaPI';

export const FALLBACK_SUPABASE_URL = MASTER_SUPABASE_URL;
export const FALLBACK_SUPABASE_ANON_KEY = MASTER_SUPABASE_ANON_KEY;

// Programmatically purge residual storage before initializing the client
if (typeof window !== 'undefined') {
  try {
    clearBrowserResidualStorage();
  } catch (_) {}
}

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dwhsqftllkximhfvwqak.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHNxZnRsbGt4aW1oZnZ3cWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzAyNzEsImV4cCI6MjEwNTMwNjI3MX0.GbceleQmKhRfSzE-c_Bq3fh-YA7I4oZI1fGCsU-SaPI';

export const supabaseKey = supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  },
  auth: {
    persistSession: true,
  },
});

console.log("Supabase Client Initialized:", supabaseUrl);

export const isSupabaseConfigured = true;

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  configured: boolean;
  url: string;
  hasPublishableKey: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      return {
        connected: false,
        configured: true,
        url: supabaseUrl,
        hasPublishableKey: true,
        error: error.message,
      };
    }
    return {
      connected: true,
      configured: true,
      url: supabaseUrl,
      hasPublishableKey: true,
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      url: supabaseUrl,
      hasPublishableKey: true,
      error: err?.message || 'Network error connecting to Supabase',
    };
  }
}

export default supabase;
