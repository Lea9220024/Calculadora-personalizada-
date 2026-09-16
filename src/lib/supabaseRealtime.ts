import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type SupabaseRealtimePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;
type RealtimeHandler = (payload: SupabaseRealtimePayload) => void;

const CALCULATOR_TABLES = [
  'calculator_transactions',
  'calculator_categories',
  'calculator_monthly_budgets',
  'calculator_settings',
  'calculator_cards',
  'calculator_installment_plans',
  'calculator_assets',
  'calculator_net_worth_snapshots',
] as const;

export function subscribeToCalculatorRealtime(userId: string, onChange: RealtimeHandler, onStatusChange?: (status: string) => void): RealtimeChannel | null {
  if (!supabase) return null;
  const channel = supabase.channel(`calculator-sync-${userId}`);
  for (const table of CALCULATOR_TABLES) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` }, onChange);
  }
  channel.subscribe((status) => onStatusChange?.(status));
  return channel;
}

export async function unsubscribeFromCalculatorRealtime(channel: RealtimeChannel) {
  if (!supabase) return;
  await supabase.removeChannel(channel);
}
