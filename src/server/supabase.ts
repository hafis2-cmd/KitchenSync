import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase environment variables (SUPABASE_URL and SUPABASE_KEY / SUPABASE_ANON_KEY) are not set. The server will run in local in-memory fallback mode.');
} else {
  console.log('✅ Supabase client successfully initialized!');
}

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;
