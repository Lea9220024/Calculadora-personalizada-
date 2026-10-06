import { supabase } from './supabase';
import {
  deleteCategoryFromSupabase,
  deletePatrimonyItemFromSupabase,
  deleteTransactionFromSupabase,
  syncBudgetToSupabase,
  syncCategoryToSupabase,
  syncNetWorthSnapshotToSupabase,
  syncPatrimonyItemToSupabase,
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
  const priority: Record<string, number> = { upsert_category: 0, delete_category: 1, upsert_transaction: 2, delete_transaction: 3 };
  const orderedQueue = [...queue].sort((a, b) => (priority[a.type] ?? 10) - (priority[b.type] ?? 10));
  for (const operation of orderedQueue) {
    try {
      switch (operation.type) {
        case 'upsert_transaction': {
          // Never retry a transaction that is already present in the user's cloud data.
          const existing = await supabase.from('calculator_transactions').select('id').eq('id', operation.payload.id).eq('user_id', session.user.id).maybeSingle();
          if (existing.error) throw new Error(`Validación del movimiento: ${existing.error.message}`);
          if (existing.data) {
            removePendingSupabaseSync(operation.id);
            break;
          }
          // category_id is a real FK. If the category is not visible for this user,
          // keep the local transaction pending instead of generating a login-time FK error.
          const category = await supabase.from('calculator_categories').select('id').eq('id', operation.payload.categoryId).eq('user_id', session.user.id).maybeSingle();
          if (category.error) throw new Error(`Validación de categoría: ${category.error.message}`);
          if (!category.data) continue;
          await syncTransactionToSupabase(operation.payload, false, false);
          break;
        }
        case 'delete_transaction':
          await deleteTransactionFromSupabase(operation.payload.id, false, false);
          break;
        case 'upsert_category': {
          // If the category already belongs to this user, the queued write is stale.
          const existingCategory = await supabase.from('calculator_categories').select('id').eq('id', operation.payload.id).eq('user_id', session.user.id).maybeSingle();
          if (existingCategory.error) throw new Error(`Validación de categoría: ${existingCategory.error.message}`);
          if (existingCategory.data) {
            removePendingSupabaseSync(operation.id);
            break;
          }
          try {
            await syncCategoryToSupabase(operation.payload, false, false);
          } catch (error) {
            // Category IDs are currently globally unique in the legacy schema. If the
            // same ID belongs to another user, do not turn that into a login-time error.
            if ((error as { message?: string; code?: string })?.code === '23505' || String((error as Error)?.message || '').includes('duplicate key')) {
              console.warn('Categoría pendiente bloqueada por ID global en uso. Se conserva localmente hasta la migración de categorías.', operation.payload.id);
              continue;
            }
            throw error;
          }
          break;
        }
        case 'delete_category':
          await deleteCategoryFromSupabase(operation.payload.id, false, false);
          break;
        case 'upsert_budget':
          await syncBudgetToSupabase(operation.payload, false, false);
          break;
        case 'upsert_settings':
          await syncSettingsToSupabase(operation.payload, false, false);
          break;
        case 'upsert_patrimony':
          await syncPatrimonyItemToSupabase(operation.payload, false, false);
          break;
        case 'delete_patrimony':
          await deletePatrimonyItemFromSupabase(operation.payload.id, false, false);
          break;
        case 'upsert_net_worth_snapshot':
          await syncNetWorthSnapshotToSupabase(operation.payload, false, false);
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
