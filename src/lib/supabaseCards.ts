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

// Dashboard income detail: the clicked card carries the active month in its label.
if (typeof window !== 'undefined') {
  const formatMoney = (n: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n);
  const MONTHS_ES: Record<string, string> = {
    Enero: '01', Febrero: '02', Marzo: '03', Abril: '04', Mayo: '05', Junio: '06',
    Julio: '07', Agosto: '08', Septiembre: '09', Octubre: '10', Noviembre: '11', Diciembre: '12'
  };
  const openIncomeDetails = (key: string) => {
    let transactions: any[] = [];
    let categories: any[] = [];
    try { transactions = JSON.parse(localStorage.getItem('mis_gastos_transactions_v1') || '[]'); } catch {}
    try { categories = JSON.parse(localStorage.getItem('mis_gastos_categories_v1') || '[]'); } catch {}
    const incomes = transactions.filter(t => t?.type === 'income' && String(t?.date || '').startsWith(key));
    const total = incomes.reduce((s, t) => s + Number(t.amount || 0), 0);
    const existing = document.getElementById('cream-income-detail-overlay');
    existing?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'cream-income-detail-overlay';
    overlay.className = 'fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm';
    overlay.innerHTML = `<div class="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#171B26] shadow-2xl overflow-hidden"><div class="flex items-center justify-between px-5 py-4 border-b border-zinc-800"><div><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">Detalle de ingresos</p><h3 class="text-lg font-extrabold text-white mt-1">Ingresos del mes</h3></div><button id="cream-income-close" class="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold">Cerrar</button></div><div class="p-5 space-y-3 max-h-[65vh] overflow-y-auto">${incomes.length ? incomes.map(t => { const c=categories.find(x=>x.id===t.categoryId); return `<div class="rounded-xl border border-zinc-800 bg-[#1C1F2A] p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-extrabold text-white">${String(t.title || 'Ingreso')}</p><p class="text-xs text-[#9AA6A0] mt-1">${String(t.date || '')} · ${String(c?.name || 'Sin categoría')}</p></div><p class="font-extrabold text-emerald-400 font-mono">$ ${formatMoney(Number(t.amount || 0))}</p></div>${t.notes ? `<p class="text-xs text-zinc-400 mt-2">${String(t.notes)}</p>` : ''}</div>`; }).join('') : '<div class="py-8 text-center text-sm text-[#9AA6A0]">No hay ingresos registrados en este mes.</div>'}<div class="flex justify-between items-center pt-2 border-t border-zinc-800"><span class="text-xs font-bold text-[#9AA6A0]">Total de ingresos</span><span class="font-extrabold text-white font-mono">$ ${formatMoney(total)}</span></div></div></div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    document.getElementById('cream-income-close')?.addEventListener('click', () => overlay.remove());
  };
  document.addEventListener('click', event => {
    const target = event.target as HTMLElement | null;
    const clickable = target?.closest('div.cursor-pointer');
    if (!clickable || clickable.id === 'cream-income-detail-overlay') return;
    const label = clickable.textContent || '';
    const match = label.match(/Ingresos Mes \((Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre) (\d{4})\)/);
    if (!match) return;
    const month = MONTHS_ES[match[1]];
    if (!month) return;
    event.stopPropagation();
    openIncomeDetails(`${match[2]}-${month}`);
  }, true);
}
