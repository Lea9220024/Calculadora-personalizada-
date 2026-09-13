import React, { useMemo, useState } from 'react';
import { CalendarClock, CreditCard, Pencil, Plus, Repeat2, Trash2, WalletCards, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Category, FinancialCard, FutureCommitment, InstallmentPlan, Subscription } from '../types';

interface FutureCommitmentsProps {
  commitments: FutureCommitment[];
  installmentPlans: InstallmentPlan[];
  subscriptions: Subscription[];
  transactions: { id: string; title: string; amount: number; type: 'expense' | 'income'; date: string; isRecurring?: boolean; categoryId: string; cardId?: string }[];
  categories: Category[];
  cards: FinancialCard[];
  currencySymbol: string;
  onAdd: (data: Omit<FutureCommitment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (item: FutureCommitment) => void;
  onDelete: (id: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const money = (value: number, symbol: string) => `${symbol}${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value)}`;
const addMonths = (date: string, months: number) => { const d = new Date(`${date}T12:00:00`); d.setMonth(d.getMonth() + months); return d.toISOString().slice(0, 10); };
const diffDays = (date: string) => Math.ceil((new Date(`${date}T12:00:00`).getTime() - new Date(`${today()}T12:00:00`).getTime()) / 86400000);

export const FutureCommitments: React.FC<FutureCommitmentsProps> = ({ commitments, installmentPlans, subscriptions, transactions, categories, cards, currencySymbol, onAdd, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FutureCommitment | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(today());
  const [categoryId, setCategoryId] = useState('');
  const [cardId, setCardId] = useState('');
  const [notes, setNotes] = useState('');

  const automatic = useMemo<FutureCommitment[]>(() => {
    const result: FutureCommitment[] = [];
    const now = today();
    installmentPlans.forEach(plan => {
      const remaining = Math.max(0, plan.installments - plan.currentInstallment);
      if (!remaining) return;
      for (let i = 1; i <= remaining; i++) {
        const date = addMonths(plan.startDate, plan.currentInstallment + i - 1);
        if (date >= now) result.push({ id: `auto-installment-${plan.id}-${i}`, name: `${plan.title} · cuota ${plan.currentInstallment + i}/${plan.installments}`, amount: plan.installmentAmount, dueDate: date, type: 'installment', cardId: plan.cardId, installmentsRemaining: remaining - i + 1, active: true, createdAt: plan.createdAt, updatedAt: plan.createdAt });
      }
    });
    subscriptions.filter(s => s.active).forEach(s => { let date = s.nextChargeDate; const monthly = s.frequency === 'monthly' ? 1 : 12; for (let i = 0; i < 12; i++) { if (date >= now) result.push({ id: `auto-subscription-${s.id}-${i}`, name: s.name, amount: s.amount, dueDate: date, type: 'subscription', categoryId: s.categoryId, cardId: s.cardId, active: true, createdAt: s.createdAt, updatedAt: s.updatedAt }); date = addMonths(date, monthly); } });
    const recurring = transactions.filter(t => t.type === 'expense' && t.isRecurring);
    recurring.forEach(t => { const next = addMonths(t.date, 1); if (next >= now) result.push({ id: `auto-recurring-${t.id}`, name: t.title, amount: t.amount, dueDate: next, type: 'recurring', categoryId: t.categoryId, cardId: t.cardId, active: true, createdAt: t.date, updatedAt: t.date }); });
    return result;
  }, [installmentPlans, subscriptions, transactions]);

  const all = useMemo(() => [...commitments.filter(c => c.active), ...automatic].sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [commitments, automatic]);
  const next30 = all.filter(c => diffDays(c.dueDate) >= 0 && diffDays(c.dueDate) <= 30);
  const next90 = all.filter(c => diffDays(c.dueDate) >= 0 && diffDays(c.dueDate) <= 90);
  const committed30 = next30.reduce((s, c) => s + c.amount, 0);
  const committed90 = next90.reduce((s, c) => s + c.amount, 0);
  const upcoming = all.slice(0, 12);

  const reset = () => { setEditing(null); setName(''); setAmount(''); setDueDate(today()); setCategoryId(categories[0]?.id ?? ''); setCardId(''); setNotes(''); setShowForm(true); };
  const edit = (c: FutureCommitment) => { setEditing(c); setName(c.name); setAmount(String(c.amount)); setDueDate(c.dueDate); setCategoryId(c.categoryId ?? categories[0]?.id ?? ''); setCardId(c.cardId ?? ''); setNotes(c.notes ?? ''); setShowForm(true); };
  const submit = (e: React.FormEvent) => { e.preventDefault(); const n = Number(amount.replace(/\./g, '').replace(',', '.')); if (!name.trim() || !Number.isFinite(n) || n < 0 || !dueDate) return; const data = { name: name.trim(), amount: n, dueDate, type: 'manual' as const, categoryId: categoryId || undefined, cardId: cardId || undefined, notes: notes.trim() || undefined, active: true }; if (editing) onUpdate({ ...editing, ...data, updatedAt: new Date().toISOString() }); else onAdd(data); setShowForm(false); };
  const label = (type: FutureCommitment['type']) => ({ manual: 'Manual', installment: 'Cuota', subscription: 'Suscripción', recurring: 'Recurrente' }[type]);
  const categoryName = (id?: string) => categories.find(c => c.id === id)?.name;
  const cardName = (id?: string) => cards.find(c => c.id === id)?.name;

  return <section className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">5.30 · Compromisos futuros</p><h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Lo que ya está comprometido.</h2><p className="text-sm text-zinc-400 mt-2 max-w-2xl">Cuotas, suscripciones, gastos recurrentes y compromisos manuales. C.R.E.A.M. los proyecta sin crear movimientos nuevos.</p></div><button onClick={reset} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-sm"><Plus className="w-4 h-4" />Agregar compromiso</button></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><div className="text-xs font-bold uppercase text-zinc-400">Próximos 30 días</div><div className="text-2xl font-extrabold text-white mt-3">{money(committed30, currencySymbol)}</div><p className="text-xs text-zinc-500 mt-1">{next30.length} compromisos</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><div className="text-xs font-bold uppercase text-zinc-400">Próximos 90 días</div><div className="text-2xl font-extrabold text-white mt-3">{money(committed90, currencySymbol)}</div><p className="text-xs text-zinc-500 mt-1">{next90.length} compromisos</p></div><div className="rounded-2xl border border-orange-500/30 bg-zinc-950 p-5"><div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase"><CalendarClock className="w-4 h-4" /> Próximo vencimiento</div><div className="text-xl font-extrabold text-white mt-3">{upcoming[0] ? money(upcoming[0].amount, currencySymbol) : '—'}</div><p className="text-xs text-zinc-500 mt-1">{upcoming[0] ? `${upcoming[0].name} · ${upcoming[0].dueDate}` : 'No hay compromisos futuros'}</p></div></div>

    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><div className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" /><div><h3 className="font-extrabold text-white">Dinero que todavía no gastaste, pero ya no deberías considerar libre</h3><p className="text-sm text-zinc-400 mt-1">Estos importes son una proyección. Los movimientos reales siguen siendo independientes y no se generan automáticamente.</p></div></div></div>

    {showForm && <form onSubmit={submit} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4"><div className="flex justify-between items-center"><h3 className="font-extrabold text-white">{editing ? 'Editar compromiso' : 'Nuevo compromiso'}</h3><button type="button" onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white">Cerrar</button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="text-xs text-zinc-400">Concepto<input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white" required /></label><label className="text-xs text-zinc-400">Importe<input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white" required /></label><label className="text-xs text-zinc-400">Fecha<select value="" hidden readOnly><option /></select><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white" required /></label><label className="text-xs text-zinc-400">Categoría<select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white"><option value="">Sin categoría</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="text-xs text-zinc-400">Tarjeta<select value={cardId} onChange={e => setCardId(e.target.value)} className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white"><option value="">Sin tarjeta</option>{cards.map(c => <option key={c.id} value={c.id}>{c.name}{c.last4 ? ` · •••• ${c.last4}` : ''}</option>)}</select></label><label className="text-xs text-zinc-400">Nota<input value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white" /></label></div><div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-300">Cancelar</button><button type="submit" className="px-4 py-2 rounded-xl bg-orange-500 text-black font-extrabold">Guardar</button></div></form>}

    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden"><div className="px-5 py-4 border-b border-zinc-800"><h3 className="font-extrabold text-white">Próximos compromisos</h3><p className="text-xs text-zinc-500 mt-1">Incluye proyecciones automáticas y registros manuales.</p></div>{upcoming.length === 0 ? <div className="p-10 text-center text-zinc-500">No hay compromisos futuros registrados.</div> : <div className="divide-y divide-zinc-800/80">{upcoming.map(c => { const days = diffDays(c.dueDate); const automaticItem = c.type !== 'manual'; return <div key={c.id} className="p-4 flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${days <= 7 ? 'bg-orange-500/10 text-orange-400' : 'bg-zinc-900 text-zinc-400'}`}>{c.type === 'installment' ? <CreditCard className="w-4 h-4" /> : c.type === 'subscription' || c.type === 'recurring' ? <Repeat2 className="w-4 h-4" /> : <CalendarClock className="w-4 h-4" />}</div><div className="min-w-0 flex-1"><div className="font-bold text-zinc-100 truncate">{c.name}</div><div className="text-xs text-zinc-500">{label(c.type)}{categoryName(c.categoryId) ? ` · ${categoryName(c.categoryId)}` : ''}{cardName(c.cardId) ? ` · ${cardName(c.cardId)}` : ''}</div></div><div className="text-right"><div className="font-extrabold text-zinc-100">{money(c.amount, currencySymbol)}</div><div className={`text-xs ${days <= 7 ? 'text-orange-400' : 'text-zinc-500'}`}>{days === 0 ? 'Hoy' : days > 0 ? `En ${days} días` : 'Vencido'} · {c.dueDate}</div></div>{!automaticItem && <><button onClick={() => edit(c)} className="p-2 text-zinc-500 hover:text-white"><Pencil className="w-4 h-4" /></button><button onClick={() => onDelete(c.id)} className="p-2 text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button></>}</div> })}</div>}</div>
    <div className="flex items-center gap-2 text-xs text-zinc-500"><CheckCircle2 className="w-4 h-4 text-emerald-400" />Las proyecciones no modifican movimientos, presupuestos, tarjetas, cuotas ni suscripciones.</div>
  </section>;
};
