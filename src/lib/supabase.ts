import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn('Supabase no está configurado todavía. Se mantiene el almacenamiento local como fuente de datos.');
}

export const supabase = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;
