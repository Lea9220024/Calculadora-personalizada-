import React, { useMemo, useState } from 'react';
import { CreditCard, Plus, Trash2, Pencil, X, CalendarDays, WalletCards, ReceiptText, ChevronDown, ChevronUp } from 'lucide-react';
import { FinancialCard, InstallmentPlan, Transaction } from '../types';

interface CardsAndInstallmentsProps {
  cards: FinancialCard[];
  installmentPlans: InstallmentPlan[];
  transactions: Transaction[];
  currentMonthKey: string;
  currencySymbol: string;
  onAddCard: (card: Omit<FinancialCard, 'id' | 'createdAt'>) => void;
  onUpdateCard: (card: FinancialCard) => void;
  onDeleteCard: (id: string) => void;
}

const money = (value: number, symbol: string) => `${symbol} ${value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const monthDiff = (start: string, current: string) => {
  const [sy, sm] = start.slice(0, 7).split('-').map(Number);
  const [cy, cm] = current.slice(0, 7).split('-').map(Number);
  if (!sy || !sm || !cy || !cm) return 0;
  return Math.max(0, (cy - sy) * 12 + (cm - sm));
};

export const CardsAndInstallments: React.FC<CardsAndInstallmentsProps> = ({ cards, installmentPlans, transactions, currentMonthKey, currencySymbol, onAddCard, onUpdateCard, onDeleteCard }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialCard | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [brand, setBrand] = useState('');
  const [last4, setLast4] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');

  const cardStats = useMemo(() => cards.map(card => {
    const monthSpent = transactions.filter(t => t.cardId === card.id && t.type === 'expense' && t.date.startsWith(currentMonthKey)).reduce((s, t) => s + t.amount, 0);
    const allSpent = transactions.filter(t => t.cardId === card.id && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const plans = installmentPlans.filter(p => p.cardId === card.id);
    const activePlans = plans.filter(p => monthDiff(p.startDate, currentMonthKey) + 1 <= p.installments);
    return { card, monthSpent, allSpent, plans, activePlans };
  }), [cards, installmentPlans, transactions, currentMonthKey]);

  const openNew = () => {
    setEditing(null); setName(''); setType('credit'); setBrand(''); setLast4(''); setCreditLimit(''); setClosingDay(''); setDueDay(''); setIsFormOpen(true);
  };
  const openEdit = (card: FinancialCard) => {
    setEditing(card); setName(card.name); setType(card.type); setBrand(card.brand || ''); setLast4(card.last4 || ''); setCreditLimit(card.creditLimit?.toString() || ''); setClosingDay(card.closingDay?.toString() || ''); setDueDay(card.dueDay?.toString() || ''); setIsFormOpen(true);
  };
  const submitCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      name: name.trim(), type, brand: brand.trim() || undefined, last4: last4.replace(/\D/g, '').slice(-4) || undefined,
      creditLimit: type === 'credit' && creditLimit ? Number(creditLimit) : undefined,
      closingDay: type === 'credit' && closingDay ? Math.min(31, Math.max(1, Number(closingDay))) : undefined,
      dueDay: type === 'credit' && dueDay ? Math.min(31, Math.max(1, Number(dueDay))) : undefined,
      active: editing?.active ?? true
    };
    if (editing) onUpdateCard({ ...editing, ...payload }); else onAddCard(payload);
    setIsFormOpen(false);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">5.27</p><h2 className="text-2xl font-black text-zinc-100 mt-1">Tarjetas + cuotas</h2><p className="text-sm text-zinc-400 mt-1">Controlá tus medios de pago y el peso de las compras en cuotas sin tocar tus movimientos existentes.</p></div>
        <button onClick={openNew} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-sm shadow-lg shadow-orange-950/30"><Plus className="w-4 h-4" /> Agregar tarjeta</button>
      </div>

      {cards.filter(c => c.active).length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center"><WalletCards className="w-9 h-9 mx-auto text-orange-400 mb-3" /><p className="font-bold text-zinc-200">Todavía no hay tarjetas cargadas.</p><p className="text-xs text-zinc-500 mt-1">Podés agregar crédito o débito y luego asociarlas a nuevos movimientos.</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cardStats.filter(({ card }) => card.active).map(({ card, monthSpent, allSpent, activePlans, plans }) => {
            const used = card.creditLimit ? Math.min(100, (allSpent / card.creditLimit) * 100) : 0;
            const expanded = expandedCard === card.id;
            return <div key={card.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden shadow-lg">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0"><CreditCard className="w-5 h-5 text-orange-400" /></div><div className="min-w-0"><h3 className="font-black text-zinc-100 truncate">{card.name}</h3><p className="text-xs text-zinc-500">{card.brand || 'Tarjeta'} {card.last4 ? `•••• ${card.last4}` : ''} · {card.type === 'credit' ? 'Crédito' : 'Débito'}</p></div></div><div className="flex items-center gap-1"><button onClick={() => openEdit(card)} className="p-2 rounded-lg text-zinc-400 hover:text-orange-400 hover:bg-zinc-800" title="Editar"><Pencil className="w-4 h-4" /></button><button onClick={() => { if (window.confirm(`¿Eliminar la tarjeta ${card.name}? Los movimientos existentes no se borrarán.`)) onDeleteCard(card.id); }} className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800" title="Eliminar"><Trash2 className="w-4 h-4" /></button></div></div>
                <div className="grid grid-cols-2 gap-3 mt-5"><div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-3"><p className="text-[10px] uppercase font-bold text-zinc-500">Gasto del mes</p><p className="mt-1 font-black text-orange-400">{money(monthSpent, currencySymbol)}</p></div><div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-3"><p className="text-[10px] uppercase font-bold text-zinc-500">Cuotas activas</p><p className="mt-1 font-black text-zinc-100">{activePlans.length}</p></div></div>
                {card.type === 'credit' && card.creditLimit ? <div className="mt-4"><div className="flex justify-between text-[11px] font-bold"><span className="text-zinc-500">Uso acumulado registrado</span><span className="text-zinc-300">{money(allSpent, currencySymbol)} / {money(card.creditLimit, currencySymbol)}</span></div><div className="h-2 rounded-full bg-zinc-800 mt-2 overflow-hidden"><div className={`h-full rounded-full ${used >= 90 ? 'bg-red-500' : used >= 70 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${used}%` }} /></div></div> : null}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800"><div className="text-[11px] text-zinc-500">{card.type === 'credit' && card.closingDay ? `Cierre: día ${card.closingDay}` : 'Débito directo'}{card.type === 'credit' && card.dueDay ? ` · Vto: día ${card.dueDay}` : ''}</div>{plans.length > 0 && <button onClick={() => setExpandedCard(expanded ? null : card.id)} className="inline-flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300">Ver cuotas {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>}</div>
              </div>
              {expanded && <div className="border-t border-zinc-800 bg-zinc-950/50 p-4 space-y-2">{plans.map(plan => { const current = Math.min(plan.installments, Math.max(1, monthDiff(plan.startDate, currentMonthKey) + 1)); const remaining = Math.max(0, plan.totalAmount - plan.installmentAmount * current); return <div key={plan.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-sm text-zinc-100">{plan.title}</p><p className="text-[11px] text-zinc-500 mt-0.5">Cuota {current} de {plan.installments} · desde {plan.startDate}</p></div><p className="font-black text-orange-400 text-sm">{money(plan.installmentAmount, currencySymbol)}/mes</p></div><div className="flex items-center justify-between mt-2 text-[11px]"><span className="text-zinc-500">Total: {money(plan.totalAmount, currencySymbol)}</span><span className="text-zinc-300">Restante: {money(remaining, currencySymbol)}</span></div><div className="h-1.5 bg-zinc-800 rounded-full mt-2 overflow-hidden"><div className="h-full bg-orange-500 rounded-full" style={{ width: `${(current / plan.installments) * 100}%` }} /></div></div>; })}</div>}
            </div>;
          })}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"><div className="flex items-center gap-2 mb-4"><ReceiptText className="w-5 h-5 text-emerald-400" /><div><h3 className="font-black text-zinc-100">Resumen de cuotas</h3><p className="text-xs text-zinc-500">Compromisos registrados en tarjetas</p></div></div>{installmentPlans.length === 0 ? <p className="text-sm text-zinc-500">Todavía no hay compras en cuotas. Cuando registres una desde “Nuevo”, aparecerán acá automáticamente.</p> : <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-3"><p className="text-[10px] uppercase font-bold text-zinc-500">Planes</p><p className="text-xl font-black text-zinc-100 mt-1">{installmentPlans.length}</p></div><div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-3"><p className="text-[10px] uppercase font-bold text-zinc-500">Pago mensual registrado</p><p className="text-xl font-black text-orange-400 mt-1">{money(installmentPlans.reduce((s, p) => s + p.installmentAmount, 0), currencySymbol)}</p></div><div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-3"><p className="text-[10px] uppercase font-bold text-zinc-500">Saldo de cuotas</p><p className="text-xl font-black text-zinc-100 mt-1">{money(installmentPlans.reduce((s, p) => { const current = Math.min(p.installments, Math.max(1, monthDiff(p.startDate, currentMonthKey) + 1)); return s + Math.max(0, p.totalAmount - p.installmentAmount * current); }, 0), currencySymbol)}</p></div></div>}</div>

      {isFormOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}><form onSubmit={submitCard} onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden"><div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800"><div><h3 className="font-black text-zinc-100">{editing ? 'Editar tarjeta' : 'Nueva tarjeta'}</h3><p className="text-xs text-zinc-500">Los datos se guardan localmente en C.R.E.A.M.</p></div><button type="button" onClick={() => setIsFormOpen(false)} className="p-2 text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button></div><div className="p-5 space-y-4"><div><label className="text-xs font-bold text-zinc-300">Nombre</label><input required value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Visa Galicia" className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500" /></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setType('credit')} className={`py-2.5 rounded-xl border text-sm font-bold ${type === 'credit' ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-zinc-800 text-zinc-500'}`}>Crédito</button><button type="button" onClick={() => setType('debit')} className={`py-2.5 rounded-xl border text-sm font-bold ${type === 'debit' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-zinc-800 text-zinc-500'}`}>Débito</button></div><div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-zinc-300">Marca</label><input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Visa / Mastercard" className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100" /></div><div><label className="text-xs font-bold text-zinc-300">Últimos 4</label><input inputMode="numeric" maxLength={4} value={last4} onChange={e => setLast4(e.target.value.replace(/\D/g, '').slice(0,4))} placeholder="1234" className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100" /></div></div>{type === 'credit' && <><div><label className="text-xs font-bold text-zinc-300">Límite de crédito</label><input type="number" min="0" step="0.01" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} placeholder="0" className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100" /></div><div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-zinc-300 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Cierre</label><input type="number" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value)} placeholder="15" className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100" /></div><div><label className="text-xs font-bold text-zinc-300 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Vencimiento</label><input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} placeholder="5" className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100" /></div></div></>}<div className="flex justify-end gap-2 pt-3 border-t border-zinc-800"><button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-bold text-zinc-400">Cancelar</button><button type="submit" className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-sm">Guardar tarjeta</button></div></div></form></div>}
    </section>
  );
};
