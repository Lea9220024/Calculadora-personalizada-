import { AppSettings, Category, MonthlyBudget, Transaction } from '../types';
import { supabase } from './supabase';

const QUEUE_KEY = 'mis_gastos_supabase_sync_queue_v1';

export type PendingOperation =
  | { id: string; type: 'upsert_transaction'; payload: Transaction }
  | { id: string; type: 'delete_transaction'; payload: { id: string } }
  | { id: string; type: 'upsert_category'; payload: Category }
  | { id: string; type: 'delete_category'; payload: { id: string } }
  | { id: string; type: 'upsert_budget'; payload: MonthlyBudget }
  | { id: string; type: 'upsert_settings'; payload: AppSettings };

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
export type PendingOperationInput = DistributiveOmit<PendingOperation, 'id'>;

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

export function enqueuePendingSupabaseSync(operation: PendingOperationInput): string {
  let key = '';
  switch (operation.type) {
    case 'upsert_transaction':
      key = operation.payload.id;
      break;
    case 'upsert_category':
      key = operation.payload.id;
      break;
    case 'delete_transaction':
    case 'delete_category':
      key = operation.payload.id;
      break;
    case 'upsert_budget':
      key = operation.payload.monthKey;
      break;
    case 'upsert_settings':
      key = 'settings';
      break;
  }
  const id = operationId(operation.type, key);
  const queue = readQueue();
  writeQueue([...queue.filter(item => item.id !== id), { ...operation, id } as PendingOperation]);
  return id;
}

export function removePendingSupabaseSync(id: string) {
  writeQueue(readQueue().filter(item => item.id !== id));
}

export function getPendingSupabaseSyncQueue() {
  return readQueue();
}

export function getPendingSupabaseSyncCount() {
  return readQueue().length;
}

// La cola se reintenta automáticamente al recuperar conexión o sesión.
// El import dinámico evita una dependencia circular con supabaseWrite.
if (typeof window !== 'undefined') {
  const flush = () => {
    void import('./supabaseSyncRunner').then(({ flushPendingSupabaseSync }) => flushPendingSupabaseSync());
  };

  window.addEventListener('online', flush);
  window.setTimeout(flush, 1500);

  if (supabase) {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        window.setTimeout(flush, 250);
      }
    });
  }
}
