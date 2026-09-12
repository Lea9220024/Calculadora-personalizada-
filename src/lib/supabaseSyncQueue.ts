import { AppSettings, Category, MonthlyBudget, Transaction } from '../types';

const QUEUE_KEY = 'mis_gastos_supabase_sync_queue_v1';

export type PendingOperation =
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

export function enqueuePendingSupabaseSync(operation: Omit<PendingOperation, 'id'>) {
  const key = operation.type === 'upsert_transaction' || operation.type === 'upsert_category'
    ? operation.payload.id
    : operation.type === 'upsert_budget'
      ? operation.payload.monthKey
      : operation.type === 'upsert_settings'
        ? 'settings'
        : operation.payload.id;
  const id = operationId(operation.type, key);
  const queue = readQueue();
  writeQueue([...queue.filter(item => item.id !== id), { ...operation, id } as PendingOperation]);
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
