import { AppSettings, Category, MonthlyBudget, NetWorthSnapshot, PatrimonyItem, Transaction } from '../types';
import { supabase } from './supabase';
import { enqueuePendingSupabaseSync, removePendingSupabaseSync } from './supabaseSyncQueue';

type SyncStatus = 'pending' | 'synced' | 'error';

const LAST_SYNC_ERROR_KEY = 'cream_last_supabase_sync_error_v1';

export type LastSupabaseSyncError = {
  label: string;
  message: string;
  timestamp: string;
};

export const getLastSupabaseSyncError = (): LastSupabaseSyncError | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAST_SYNC_ERROR_KEY);
    return raw ? JSON.parse(raw) as LastSupabaseSyncError : null;
  } catch {
    return null;
  }
};

const saveLastSupabaseSyncError = (label: string, message: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_SYNC_ERROR_KEY, JSON.stringify({ label, message, timestamp: new Date().toISOString() }));
  } catch {}
};

export const clearLastSupabaseSyncError = () => {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(LAST_SYNC_ERROR_KEY); } catch {}
};

const notifySyncStatus = (status: SyncStatus, label?: string, error?: string) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('supabase-sync-status', { detail: { status, label, error } }));
};
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getAuthenticatedUserId(): Promise<string> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Sesión: ${error.message}`);
  const userId = session?.user?.id;
  if (!userId) throw new Error('No hay una sesión iniciada. Inicia sesión con la misma cuenta en tus dispositivos.');
  return userId;
}

async function withRetry<T>(operation: () => Promise<T>, label: string, attempts = 3, reportStatus = true): Promise<T> {
  if (reportStatus) notifySyncStatus('pending', label);
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await operation();
      if (reportStatus) {
        clearLastSupabaseSyncError();
        notifySyncStatus('synced', label);
      }
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(500 * attempt);
    }
  }
  const message = lastError instanceof Error ? lastError.message : `No se pudo sincronizar ${label}.`;
  saveLastSupabaseSyncError(label, message);
  if (reportStatus) notifySyncStatus('error', label, message);
  throw lastError instanceof Error ? lastError : new Error(message);
}

export async function syncTransactionToSupabase(transaction: Transaction, enqueueOnAttempt = true, reportStatus = true): Promise<void> {
  const pendingId = enqueueOnAttempt ? enqueuePendingSupabaseSync({ type: 'upsert_transaction', payload: transaction }) : null;
  await withRetry(async () => {
    const userId = await getAuthenticatedUserId();
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.from('calculator_transactions').upsert({ id: transaction.id, user_id: userId, title: transaction.title, amount: transaction.amount, type: transaction.type, category_id: transaction.categoryId, date: transaction.date, payment_method: transaction.paymentMethod, notes: transaction.notes ?? null, is_recurring: transaction.isRecurring ?? false, created_at: transaction.createdAt }, { onConflict: 'id' });
    if (error) throw new Error(`Movimiento: ${error.message}`);
  }, 'el movimiento', 3, reportStatus);
  if (pendingId) removePendingSupabaseSync(pendingId);
}

export async function deleteTransactionFromSupabase(id: string, enqueueOnAttempt = true, reportStatus = true): Promise<void> {
  const pendingId = enqueueOnAttempt ? enqueuePendingSupabaseSync({ type: 'delete_transaction', payload: { id } }) : null;
  await withRetry(async () => {
    const userId = await getAuthenticatedUserId();
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.from('calculator_transactions').delete().eq('id', id).eq('user_id', userId);
    if (error) throw new Error(`Movimiento: ${error.message}`);
  }, 'la eliminación del movimiento', 3, reportStatus);
  if (pendingId) removePendingSupabaseSync(pendingId);
}

export async function syncBudgetToSupabase(budget: MonthlyBudget, enqueueOnAttempt = true, reportStatus = true): Promise<void> {
  const pendingId = enqueueOnAttempt ? enqueuePendingSupabaseSync({ type: 'upsert_budget', payload: budget }) : null;
  await withRetry(async () => {
    const userId = await getAuthenticatedUserId();
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { data: existingBudget, error: findError } = await supabase.from('calculator_monthly_budgets').select('id').eq('user_id', userId).eq('month_key', budget.monthKey).maybeSingle();
    if (findError) throw new Error(`Presupuesto ${budget.monthKey}: ${findError.message}`);
    const budgetData = { user_id: userId, month_key: budget.monthKey, total_target: budget.totalTarget, category_targets: budget.categoryTargets };
    const result = existingBudget ? await supabase.from('calculator_monthly_budgets').update(budgetData).eq('id', existingBudget.id).eq('user_id', userId) : await supabase.from('calculator_monthly_budgets').insert(budgetData);
    if (result.error) throw new Error(`Presupuesto ${budget.monthKey}: ${result.error.message}`);
  }, `el presupuesto ${budget.monthKey}`, 3, reportStatus);
  if (pendingId) removePendingSupabaseSync(pendingId);
}

export async function syncCategoryToSupabase(category: Category, enqueueOnAttempt = true, reportStatus = true): Promise<void> {
  const pendingId = enqueueOnAttempt ? enqueuePendingSupabaseSync({ type: 'upsert_category', payload: category }) : null;
  await withRetry(async () => {
    const userId = await getAuthenticatedUserId();
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.from('calculator_categories').upsert({ id: category.id, user_id: userId, name: category.name, icon: category.icon, color: category.color, text_color: category.textColor, type: category.type }, { onConflict: 'id' });
    if (error) throw new Error(`Categoría: ${error.message}`);
  }, 'la categoría', 3, reportStatus);
  if (pendingId) removePendingSupabaseSync(pendingId);
}

export async function deleteCategoryFromSupabase(id: string, enqueueOnAttempt = true, reportStatus = true): Promise<void> {
  const pendingId = enqueueOnAttempt ? enqueuePendingSupabaseSync({ type: 'delete_category', payload: { id } }) : null;
  await withRetry(async () => {
    const userId = await getAuthenticatedUserId();
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.from('calculator_categories').delete().eq('id', id).eq('user_id', userId);
    if (error) throw new Error(`Categoría: ${error.message}`);
  }, 'la eliminación de la categoría', 3, reportStatus);
  if (pendingId) removePendingSupabaseSync(pendingId);
}

export async function syncSettingsToSupabase(settings: AppSettings, enqueueOnAttempt = true, reportStatus = true): Promise<void> {
  const pendingId = enqueueOnAttempt ? enqueuePendingSupabaseSync({ type: 'upsert_settings', payload: settings }) : null;
  await withRetry(async () => {
    const userId = await getAuthenticatedUserId();
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.from('calculator_settings').upsert({ user_id: userId, currency_symbol: settings.currencySymbol, currency_code: settings.currencyCode, theme: settings.theme, start_day_of_month: settings.startDayOfMonth }, { onConflict: 'user_id' });
    if (error) throw new Error(`Configuración: ${error.message}`);
  }, 'la configuración', 3, reportStatus);
  if (pendingId) removePendingSupabaseSync(pendingId);
}

export async function syncPatrimonyItemToSupabase(item: PatrimonyItem, enqueueOnAttempt = true, reportStatus = true): Promise<void> {
  const pendingId = enqueueOnAttempt ? enqueuePendingSupabaseSync({ type: 'upsert_patrimony', payload: item }) : null;
  await withRetry(async () => {
    const userId = await getAuthenticatedUserId();
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.from('calculator_assets').upsert({ id: item.id, user_id: userId, name: item.name, type: item.type, category: item.category, value: item.value, valuation_date: item.valuationDate, notes: item.notes ?? null, created_at: item.createdAt, updated_at: item.updatedAt }, { onConflict: 'id' });
    if (error) throw new Error(`Patrimonio: ${error.message}`);
  }, 'el patrimonio', 3, reportStatus);
  if (pendingId) removePendingSupabaseSync(pendingId);
}

export async function deletePatrimonyItemFromSupabase(id: string, enqueueOnAttempt = true, reportStatus = true): Promise<void> {
  const pendingId = enqueueOnAttempt ? enqueuePendingSupabaseSync({ type: 'delete_patrimony', payload: { id } }) : null;
  await withRetry(async () => {
    const userId = await getAuthenticatedUserId();
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.from('calculator_assets').delete().eq('id', id).eq('user_id', userId);
    if (error) throw new Error(`Eliminación del patrimonio: ${error.message}`);
  }, 'la eliminación del patrimonio', 3, reportStatus);
  if (pendingId) removePendingSupabaseSync(pendingId);
}

const normalizeSnapshotId = (id: string): string => {
  const uuid = id.startsWith('snapshot-') ? id.slice('snapshot-'.length) : id;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(uuid)) return uuid;
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : id;
};

export async function syncNetWorthSnapshotToSupabase(snapshot: NetWorthSnapshot, enqueueOnAttempt = true, reportStatus = true): Promise<void> {
  const pendingId = enqueueOnAttempt ? enqueuePendingSupabaseSync({ type: 'upsert_net_worth_snapshot', payload: snapshot }) : null;
  await withRetry(async () => {
    const userId = await getAuthenticatedUserId();
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.from('calculator_net_worth_snapshots').upsert({ id: normalizeSnapshotId(snapshot.id), user_id: userId, snapshot_date: snapshot.snapshotDate, total_assets: snapshot.totalAssets, total_liabilities: snapshot.totalLiabilities, net_worth: snapshot.netWorth, created_at: snapshot.createdAt }, { onConflict: 'user_id,snapshot_date' });
    if (error) throw new Error(`Historial patrimonial: ${error.message}`);
  }, 'el historial patrimonial', 3, reportStatus);
  if (pendingId) removePendingSupabaseSync(pendingId);
}
