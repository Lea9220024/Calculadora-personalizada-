import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type SupabaseRealtimePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

type RealtimeHandler = (payload: SupabaseRealtimePayload) => void;

const CALCULATOR_TABLES = [
  'calculator_transactions',
  'calculator_categories',
  'calculator_monthly_budgets',
  'calculator_settings',
] as const;

export function subscribeToCalculatorRealtime(
  userId: string,
  onChange: RealtimeHandler,
  onStatusChange?: (status: string) => void,
) {
  if (!supabase) return null;

  const channel = supabase.channel(`calculator-sync-${userId}`);

  for (const table of CALCULATOR_TABLES) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
      },
      onChange,
    );
  }

  channel.subscribe((status) => {
    onStatusChange?.(status);
  });

  return channel;
}

export async function unsubscribeFromCalculatorRealtime(channel: ReturnType<NonNullable<typeof supabase>['channel']>) {
  if (!supabase) return;
  await supabase.removeChannel(channel);
}
