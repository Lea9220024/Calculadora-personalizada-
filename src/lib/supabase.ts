import { createClient } from '@supabase/supabase-js';

const cleanEnvValue = (value: unknown) => String(value ?? '').trim().replace(/^['"]|['"]$/g, '');

export const supabaseUrl = cleanEnvValue(import.meta.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
export const supabasePublishableKey = cleanEnvValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn('Supabase no está configurado todavía. Se mantiene el almacenamiento local como fuente de datos.');
}

export const supabase = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;
