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

  for (const operation of getPendingSupabaseSyncQueue()) {
    try {
      switch (operation.type) {
        case 'upsert_transaction':
          await syncTransactionToSupabase(operation.payload);
          break;
        case 'delete_transaction':
          await deleteTransactionFromSupabase(operation.payload.id);
          break;
        case 'upsert_category':
          await syncCategoryToSupabase(operation.payload);
          break;
        case 'delete_category':
          await deleteCategoryFromSupabase(operation.payload.id);
          break;
        case 'upsert_budget':
          await syncBudgetToSupabase(operation.payload);
          break;
        case 'upsert_settings':
          await syncSettingsToSupabase(operation.payload);
          break;
      }
      removePendingSupabaseSync(operation.id);
    } catch (error) {
      console.warn('Sincronización pendiente conservada para reintento.', error);
      break;
    }
  }
}
