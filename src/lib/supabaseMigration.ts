import { supabase } from './supabase';
import { AppSettings, Category, MonthlyBudget, Transaction } from '../types';
export interface MigrationPayload { transactions: Transaction[]; categories: Category[]; budgets: MonthlyBudget[]; settings: AppSettings; }
export interface MigrationResult { categories: number; transactions: number; budgets: number; settings: number; }
export async function migrateLocalDataToSupabase(userId: string, payload: MigrationPayload): Promise<MigrationResult> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { error: categoryError } = await supabase.from('calculator_categories').upsert(payload.categories.map((category) => ({ id: category.id, user_id: userId, name: category.name, icon: category.icon, color: category.color, text_color: category.textColor, type: category.type })), { onConflict: 'id' });
  if (categoryError) throw new Error(`Categorías: ${categoryError.message}`);
  const { error: transactionError } = await supabase.from('calculator_transactions').upsert(payload.transactions.map((transaction) => ({ id: transaction.id, user_id: userId, title: transaction.title, amount: transaction.amount, type: transaction.type, category_id: transaction.categoryId, date: transaction.date, payment_method: transaction.paymentMethod, notes: transaction.notes ?? null, is_recurring: transaction.isRecurring ?? false, created_at: transaction.createdAt })), { onConflict: 'id' });
  if (transactionError) throw new Error(`Movimientos: ${transactionError.message}`);
  for (const budget of payload.budgets) {
    const { data: existingBudget, error: findError } = await supabase.from('calculator_monthly_budgets').select('id').eq('user_id', userId).eq('month_key', budget.monthKey).maybeSingle();
    if (findError) throw new Error(`Presupuesto ${budget.monthKey}: ${findError.message}`);
    const budgetData = { user_id: userId, month_key: budget.monthKey, total_target: budget.totalTarget, category_targets: budget.categoryTargets };
    const { error } = existingBudget ? await supabase.from('calculator_monthly_budgets').update(budgetData).eq('id', existingBudget.id) : await supabase.from('calculator_monthly_budgets').insert(budgetData);
    if (error) throw new Error(`Presupuesto ${budget.monthKey}: ${error.message}`);
  }
  const { error: settingsError } = await supabase.from('calculator_settings').upsert({ user_id: userId, currency_symbol: payload.settings.currencySymbol, currency_code: payload.settings.currencyCode, theme: payload.settings.theme, start_day_of_month: payload.settings.startDayOfMonth }, { onConflict: 'user_id' });
  if (settingsError) throw new Error(`Configuración: ${settingsError.message}`);
  return { categories: payload.categories.length, transactions: payload.transactions.length, budgets: payload.budgets.length, settings: 1 };
}
