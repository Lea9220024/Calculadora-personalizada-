import { supabase } from './supabase';
import {
  deleteCategoryFromSupabase,
  deleteTransactionFromSupabase,
  syncBudgetToSupabase,
  syncCategoryToSupabase,
  syncSettingsToSupabase,
  syncTransactionToSupabase,
} from './supabaseWrite';
import {
  getPendingSupabaseSyncQueue,
  removePendingSupabaseSync,
} from './supabaseSyncQueue';

export async function flushPendingSupabaseSync() {
  if (!supabase || !navigator.onLine) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const queue = getPendingSupabaseSyncQueue();
  if (queue.length > 0) {
    window.dispatchEvent(new CustomEvent('supabase-sync-status', { detail: { status: 'pending', label: 'cola pendiente' } }));
  }

  let hadFailure = false;
  for (const operation of queue) {
    try {
      switch (operation.type) {
        case 'upsert_transaction':
          await syncTransactionToSupabase(operation.payload, false, false);
          break;
        case 'delete_transaction':
          await deleteTransactionFromSupabase(operation.payload.id, false, false);
          break;
        case 'upsert_category':
          await syncCategoryToSupabase(operation.payload, false, false);
          break;
        case 'delete_category':
          await deleteCategoryFromSupabase(operation.payload.id, false, false);
          break;
        case 'upsert_budget':
          await syncBudgetToSupabase(operation.payload, false);
          break;
        case 'upsert_settings':
          await syncSettingsToSupabase(operation.payload, false, false);
          break;
      }
      removePendingSupabaseSync(operation.id);
    } catch (error) {
      hadFailure = true;
      console.warn('Sincronización pendiente conservada para reintento.', error);
      break;
    }
  }

  const remaining = getPendingSupabaseSyncQueue().length;
  if (!hadFailure && remaining === 0) {
    window.dispatchEvent(new CustomEvent('supabase-sync-status', { detail: { status: 'synced', label: 'cola pendiente' } }));
  }
}
