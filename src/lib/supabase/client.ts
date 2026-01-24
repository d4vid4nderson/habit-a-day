import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  // Only create client on the browser
  if (typeof window === 'undefined') {
    // Return a placeholder that will throw on use during SSR
    return {} as SupabaseClient;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  // Use singleton pattern to avoid creating multiple clients
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return client;
}

export function hasSupabaseConfig(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}
