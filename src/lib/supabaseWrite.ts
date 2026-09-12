import { AppSettings, Category, MonthlyBudget, Transaction } from '../types';
import { supabase } from './supabase';

async function getAuthenticatedUserId(): Promise<string | null> {
  if (!supabase) return null;

  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function syncTransactionToSupabase(transaction: Transaction): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId || !supabase) return;

  const { error } = await supabase.from('calculator_transactions').upsert({
    id: transaction.id,
    user_id: userId,
    title: transaction.title,
    amount: transaction.amount,
    type: transaction.type,
    category_id: transaction.categoryId,
    date: transaction.date,
    payment_method: transaction.paymentMethod,
    notes: transaction.notes ?? null,
    is_recurring: transaction.isRecurring ?? false,
    created_at: transaction.createdAt,
  }, { onConflict: 'id' });

  if (error) throw new Error(`Movimiento: ${error.message}`);
}

export async function deleteTransactionFromSupabase(id: string): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId || !supabase) return;

  const { error } = await supabase
    .from('calculator_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(`Movimiento: ${error.message}`);
}

export async function syncBudgetToSupabase(budget: MonthlyBudget): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId || !supabase) return;

  const { data: existingBudget, error: findError } = await supabase
    .from('calculator_monthly_budgets')
    .select('id')
    .eq('user_id', userId)
    .eq('month_key', budget.monthKey)
    .maybeSingle();

  if (findError) throw new Error(`Presupuesto ${budget.monthKey}: ${findError.message}`);

  const budgetData = {
    user_id: userId,
    month_key: budget.monthKey,
    total_target: budget.totalTarget,
    category_targets: budget.categoryTargets,
  };

  const result = existingBudget
    ? await supabase.from('calculator_monthly_budgets').update(budgetData).eq('id', existingBudget.id).eq('user_id', userId)
    : await supabase.from('calculator_monthly_budgets').insert(budgetData);

  if (result.error) throw new Error(`Presupuesto ${budget.monthKey}: ${result.error.message}`);
}

export async function syncCategoryToSupabase(category: Category): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId || !supabase) return;

  const { error } = await supabase.from('calculator_categories').upsert({
    id: category.id,
    user_id: userId,
    name: category.name,
    icon: category.icon,
    color: category.color,
    text_color: category.textColor,
    type: category.type,
  }, { onConflict: 'id' });

  if (error) throw new Error(`Categoría: ${error.message}`);
}

export async function deleteCategoryFromSupabase(id: string): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId || !supabase) return;

  const { error } = await supabase
    .from('calculator_categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(`Categoría: ${error.message}`);
}

export async function syncSettingsToSupabase(settings: AppSettings): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId || !supabase) return;

  const { error } = await supabase.from('calculator_settings').upsert({
    user_id: userId,
    currency_symbol: settings.currencySymbol,
    currency_code: settings.currencyCode,
    theme: settings.theme,
    start_day_of_month: settings.startDayOfMonth,
  }, { onConflict: 'user_id' });

  if (error) throw new Error(`Configuración: ${error.message}`);
}
