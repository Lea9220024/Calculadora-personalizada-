import { supabase } from './supabase';
import { AppSettings, Category, MonthlyBudget, NetWorthSnapshot, PatrimonyItem, Transaction } from '../types';
import { enqueuePendingSupabaseSync } from './supabaseSyncQueue';

const TRANSACTIONS_STORAGE_KEY = 'mis_gastos_transactions_v1';

export interface SupabaseDataPayload {
  transactions: Transaction[];
  categories: Category[];
  budgets: MonthlyBudget[];
  settings: AppSettings | null;
  patrimonyItems: PatrimonyItem[];
  netWorthSnapshots: NetWorthSnapshot[];
}

function readLocalTransactions(): Transaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mergeTransactions(cloudTransactions: Transaction[]): Transaction[] {
  const localTransactions = readLocalTransactions();
  if (!localTransactions.length) return cloudTransactions;

  const cloudIds = new Set(cloudTransactions.map((transaction) => transaction.id));
  const localOnlyTransactions = localTransactions.filter((transaction) => transaction?.id && !cloudIds.has(transaction.id));

  // La nube nunca pisa datos locales que todavía no llegaron a Supabase.
  // Cada registro local faltante queda en la cola para subirlo automáticamente.
  for (const transaction of localOnlyTransactions) {
    enqueuePendingSupabaseSync({ type: 'upsert_transaction', payload: transaction });
  }

  return [...localOnlyTransactions, ...cloudTransactions];
}

export async function readUserDataFromSupabase(userId: string): Promise<SupabaseDataPayload> {
  if (!supabase) throw new Error('Supabase no está configurado.');

  const [transactionsResult, categoriesResult, budgetsResult, settingsResult, patrimonyResult, snapshotsResult] = await Promise.all([
    supabase.from('calculator_transactions').select('*').eq('user_id', userId),
    supabase.from('calculator_categories').select('*').eq('user_id', userId),
    supabase.from('calculator_monthly_budgets').select('*').eq('user_id', userId),
    supabase.from('calculator_settings').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('calculator_assets').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
    supabase.from('calculator_net_worth_snapshots').select('*').eq('user_id', userId).order('snapshot_date', { ascending: false }),
  ]);

  if (transactionsResult.error) throw new Error(`Movimientos: ${transactionsResult.error.message}`);
  if (categoriesResult.error) throw new Error(`Categorías: ${categoriesResult.error.message}`);
  if (budgetsResult.error) throw new Error(`Presupuestos: ${budgetsResult.error.message}`);
  if (settingsResult.error) throw new Error(`Configuración: ${settingsResult.error.message}`);
  if (patrimonyResult.error) throw new Error(`Patrimonio: ${patrimonyResult.error.message}`);
  if (snapshotsResult.error) throw new Error(`Historial patrimonial: ${snapshotsResult.error.message}`);

  const cloudTransactions = (transactionsResult.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    type: row.type,
    categoryId: row.category_id,
    date: row.date,
    paymentMethod: row.payment_method,
    notes: row.notes ?? undefined,
    isRecurring: row.is_recurring ?? false,
    createdAt: row.created_at,
  }));

  return {
    transactions: mergeTransactions(cloudTransactions),
    categories: (categoriesResult.data ?? []).map((row) => ({ id: row.id, name: row.name, icon: row.icon, color: row.color, textColor: row.text_color, type: row.type })),
    budgets: (budgetsResult.data ?? []).map((row) => ({ monthKey: row.month_key, totalTarget: Number(row.total_target), categoryTargets: row.category_targets ?? {} })),
    settings: settingsResult.data ? { currencySymbol: settingsResult.data.currency_symbol, currencyCode: settingsResult.data.currency_code, theme: settingsResult.data.theme, startDayOfMonth: settingsResult.data.start_day_of_month } : null,
    patrimonyItems: (patrimonyResult.data ?? []).map((row) => ({ id: row.id, name: row.name, type: row.type, category: row.category, value: Number(row.value), valuationDate: row.valuation_date, notes: row.notes ?? undefined, createdAt: row.created_at, updatedAt: row.updated_at })),
    netWorthSnapshots: (snapshotsResult.data ?? []).map((row) => ({ id: row.id, snapshotDate: row.snapshot_date, totalAssets: Number(row.total_assets), totalLiabilities: Number(row.total_liabilities), netWorth: Number(row.net_worth), createdAt: row.created_at })),
  };
}
