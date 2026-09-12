import { AppSettings, Category, MonthlyBudget, Transaction } from '../types';
import {
  deleteCategoryFromSupabase,
  deleteTransactionFromSupabase,
  syncBudgetToSupabase,
  syncCategoryToSupabase,
  syncSettingsToSupabase,
  syncTransactionToSupabase,
} from './supabaseWrite';
import { supabase } from './supabase';

const QUEUE_KEY = 'mis_gastos_supabase_sync_queue_v1';

type PendingOperation =
  | { id: string; type: 'upsert_transaction'; payload: Transaction }
  | { id: string; type: 'delete_transaction'; payload: { id: string } }
  | { id: string; type: 'upsert_category'; payload: Category }
  | { id: string; type: 'delete_category'; payload: { id: string } }
  | { id: string; type: 'upsert_budget'; payload: MonthlyBudget }
  | { id: string; type: 'upsert_settings'; payload: AppSettings };

const readQueue = (): PendingOperation[] => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue: PendingOperation[]) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

const operationId = (type: PendingOperation['type'], key: string) => `${type}:${key}`;

export function enqueueSupabaseSync(operation: Omit<PendingOperation, 'id'>) {
  const queue = readQueue();
  const key = operation.type === 'upsert_transaction' || operation.type === 'upsert_category'
    ? operation.payload.id
    : operation.type === 'upsert_budget'
      ? operation.payload.monthKey
      : operation.type === 'upsert_settings'
        ? 'settings'
        : operation.payload.id;
  const id = operationId(operation.type, key);

  // Una operación posterior del mismo recurso reemplaza a la anterior.
  const next = [...queue.filter(item => item.id !== id), { ...operation, id } as PendingOperation];
  writeQueue(next);
  void flushPendingSupabaseSync();
}

async function execute(operation: PendingOperation) {
  switch (operation.type) {
    case 'upsert_transaction': return syncTransactionToSupabase(operation.payload);
    case 'delete_transaction': return deleteTransactionFromSupabase(operation.payload.id);
    case 'upsert_category': return syncCategoryToSupabase(operation.payload);
    case 'delete_category': return deleteCategoryFromSupabase(operation.payload.id);
    case 'upsert_budget': return syncBudgetToSupabase(operation.payload);
    case 'upsert_settings': return syncSettingsToSupabase(operation.payload);
  }
}

export async function flushPendingSupabaseSync() {
  if (!supabase || !navigator.onLine) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const queue = readQueue();
  for (const operation of queue) {
    try {
      await execute(operation);
      const current = readQueue().filter(item => item.id !== operation.id);
      writeQueue(current);
    } catch (error) {
      console.warn('Sincronización pendiente conservada para reintento.', error);
      break;
    }
  }
}

export function getPendingSupabaseSyncCount() {
  return readQueue().length;
}
