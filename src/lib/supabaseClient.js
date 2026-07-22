import { createClient } from '@supabase/supabase-js';
import { env, validateClientEnv } from '../config/env';

const envStatus = validateClientEnv();

if (!envStatus.valid) {
  console.error(envStatus.error);
}

export const supabase = envStatus.valid
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    return {
      client: null,
      error: 'Supabase is not configured correctly.',
    };
  }

  return {
    client: supabase,
    error: null,
  };
}
