import { supabase } from './supabase';
import { AppSettings, Category, MonthlyBudget, Transaction } from '../types';

export interface SupabaseDataPayload {
  transactions: Transaction[];
  categories: Category[];
  budgets: MonthlyBudget[];
  settings: AppSettings | null;
}

export async function readUserDataFromSupabase(userId: string): Promise<SupabaseDataPayload> {
  if (!supabase) throw new Error('Supabase no está configurado.');

  const [transactionsResult, categoriesResult, budgetsResult, settingsResult] = await Promise.all([
    supabase.from('calculator_transactions').select('*').eq('user_id', userId),
    supabase.from('calculator_categories').select('*').eq('user_id', userId),
    supabase.from('calculator_monthly_budgets').select('*').eq('user_id', userId),
    supabase.from('calculator_settings').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  if (transactionsResult.error) throw new Error(`Movimientos: ${transactionsResult.error.message}`);
  if (categoriesResult.error) throw new Error(`Categorías: ${categoriesResult.error.message}`);
  if (budgetsResult.error) throw new Error(`Presupuestos: ${budgetsResult.error.message}`);
  if (settingsResult.error) throw new Error(`Configuración: ${settingsResult.error.message}`);

  return {
    transactions: (transactionsResult.data ?? []).map((row) => ({
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
    })),
    categories: (categoriesResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      textColor: row.text_color,
      type: row.type,
    })),
    budgets: (budgetsResult.data ?? []).map((row) => ({
      monthKey: row.month_key,
      totalTarget: Number(row.total_target),
      categoryTargets: row.category_targets ?? {},
    })),
    settings: settingsResult.data
      ? {
          currencySymbol: settingsResult.data.currency_symbol,
          currencyCode: settingsResult.data.currency_code,
          theme: settingsResult.data.theme,
          startDayOfMonth: settingsResult.data.start_day_of_month,
        }
      : null,
  };
}
