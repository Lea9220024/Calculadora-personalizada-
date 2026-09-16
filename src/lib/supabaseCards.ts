// Cloud persistence for cards and installment plans. Financial data is never reset here.
import { FinancialCard, InstallmentPlan } from '../types';
import { supabase } from './supabase';

async function userId() {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Sesión: ${error.message}`);
  if (!session?.user?.id) throw new Error('No hay una sesión iniciada.');
  return session.user.id;
}

export async function syncCardToSupabase(card: FinancialCard) {
  const uid = await userId();
  const { error } = await supabase!.from('calculator_cards').upsert({ id: card.id, user_id: uid, name: card.name, type: card.type, brand: card.brand ?? null, last4: card.last4 ?? null, credit_limit: card.creditLimit ?? null, closing_day: card.closingDay ?? null, due_day: card.dueDay ?? null, active: card.active, created_at: card.createdAt }, { onConflict: 'id' });
  if (error) throw new Error(`Tarjeta: ${error.message}`);
}

export async function deleteCardFromSupabase(id: string) {
  const uid = await userId();
  const { error } = await supabase!.from('calculator_cards').delete().eq('id', id).eq('user_id', uid);
  if (error) throw new Error(`Eliminación de tarjeta: ${error.message}`);
}

export async function syncInstallmentPlanToSupabase(plan: InstallmentPlan) {
  const uid = await userId();
  const { error } = await supabase!.from('calculator_installment_plans').upsert({ id: plan.id, user_id: uid, card_id: plan.cardId, title: plan.title, total_amount: plan.totalAmount, installment_amount: plan.installmentAmount, installments: plan.installments, current_installment: plan.currentInstallment, start_date: plan.startDate, transaction_id: plan.transactionId ?? null, notes: plan.notes ?? null, created_at: plan.createdAt }, { onConflict: 'id' });
  if (error) throw new Error(`Plan de cuotas: ${error.message}`);
}
