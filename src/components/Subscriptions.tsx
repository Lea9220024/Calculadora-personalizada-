import React, { useMemo, useState } from 'react';
import { BellRing, CalendarClock, Check, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Category, FinancialCard, PaymentMethod, Subscription, SubscriptionFrequency } from '../types';
import { PAYMENT_METHOD_LABELS } from '../utils/formatters';

interface Props {
  subscriptions: Subscription[];
  categories: Category[];
  cards: FinancialCard[];
  transactions: { title: string; amount: number; type: 'expense' | 'income'; isRecurring?: boolean; categoryId: string; paymentMethod: PaymentMethod; cardId?: string; date: string }[];
  currentMonthKey: string;
  currencySymbol: string;
  onAdd: (subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
}

const money = (n: number, s: string) => `${s} ${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
const dateObj = (value: string) => new Date(`${value}T12:00:00`);
const formatDate = (value: string) => dateObj(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
const daysUntil = (value: string) => Math.ceil((dateObj(value).getTime() - dateObj(new Date().toISOString().slice(0, 10)).getTime()) / 86400000);

export const Subscriptions: React.FC<Props> = ({ subscriptions, categories, cards, transactions, currentMonthKey, currencySymbol, onAdd, onUpdate, onDelete }) => {
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('monthly');
  const [nextChargeDate, setNextChargeDate] = useState(`${currentMonthKey}-15`);
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tarjeta_credito');
  const [cardId, setCardId] = useState('');
  const [notes, setNotes] = useState('');

  const active = useMemo(() => subscriptions.filter(s => s.active), [subscriptions]);
  const monthlyCost = useMemo(() => active.reduce((sum, s) => sum + (s.frequency === 'monthly' ? s.amount : s.amount / 12), 0), [active]);
  const annualCost = useMemo(() => active.reduce((sum, s) => sum + (s.frequency === 'monthly' ? s.amount * 12 : s.amount), 0), [active]);
  const upcoming = useMemo(() => [...active].sort((a, b) => a.nextChargeDate.localeCompare(b.nextChargeDate)).slice(0, 5), [active]);
  const suggestions = useMemo(() => {
    const existing = new Set(active.map(s => `${s.name.trim().toLowerCase()}|${s.amount}`));
    return transactions.filter(t => t.type === 'expense' && t.isRecurring && !existing.has(`${t.title.trim().toLowerCase()}|${t.amount}`)).slice(0, 6);
  }, [transactions, active]);

  const reset = () => { setEditing(null); setName(''); setAmount(''); setFrequency('monthly'); setNextChargeDate(`${currentMonthKey}-15`); setCategoryId(categories.find(c => c.type === 'expense' || c.type === 'both')?.id || ''); setPaymentMethod('tarjeta_credito'); setCardId(''); setNotes(''); };
  const openNew = () => { reset(); setOpenForm(true); };
  const openEdit = (s: Subscription) => { setEditing(s); setName(s.name); setAmount(String(s.amount)); setFrequency(s.frequency); setNextChargeDate(s.nextChargeDate); setCategoryId(s.categoryId || ''); setPaymentMethod(s.paymentMethod); setCardId(s.cardId || ''); setNotes(s.notes || ''); setOpenForm(true); };
  const submit = (e: React.FormEvent) => { e.preventDefault(); const numeric = Number(amount); if (!name.trim() || !Number.isFinite(numeric) || numeric <= 0 || !nextChargeDate) return; const payload = { name: name.trim(), amount: numeric, frequency, nextChargeDate, categoryId: categoryId || undefined, paymentMethod, cardId: cardId || undefined, active: editing?.active ?? true, notes: notes.trim() || undefined }; if (editing) onUpdate({ ...editing, ...payload, updatedAt: new Date().toISOString() }); else onAdd(payload); setOpenForm(false); };
  const createFromSuggestion = (t: Props['transactions'][number]) => { const next = new Date(); const date = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(Math.min(28, next.getDate())).padStart(2, '0')}`; onAdd({ name: t.title, amount: t.amount, frequency: 'monthly', nextChargeDate: date, categoryId: t.categoryId, paymentMethod: t.paymentMethod, cardId: t.cardId, active: true, notes: 'Detectada desde un movimiento marcado como recurrente.' }); };

  return <section className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">COSTOS FIJOS DIGITALES</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-['Plus_Jakarta_Sans']">Suscripciones & Recurrentes</h2>
        <p className="text-sm text-[#9AA6A0] mt-1">Controlá servicios periódicos, renovaciones programadas e impacto consolidado en el flujo de caja.</p>
      </div>
      <button onClick={openNew} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md transition-all">
        <Plus className="w-4 h-4 text-black" strokeWidth={3} /> Nueva Suscripción
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="rounded-2xl border border-zinc-800 bg-[#171B26] p-5 shadow-sm">
        <p className="text-[10px] uppercase font-bold text-[#9AA6A0]">Suscripciones Activas</p>
        <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-mono">{active.length}</p>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-[#171B26] p-5 shadow-sm">
        <p className="text-[10px] uppercase font-bold text-[#9AA6A0]">Costo Mensual Consolidado</p>
        <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-2 font-mono">{money(monthlyCost, currencySymbol)}</p>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-[#171B26] p-5 shadow-sm">
        <p className="text-[10px] uppercase font-bold text-[#9AA6A0]">Impacto Anual Proyectado</p>
        <p className="text-xl sm:text-2xl font-extrabold text-white mt-2 font-mono">{money(annualCost, currencySymbol)}</p>
      </div>
    </div>

    {upcoming.length > 0 && (
      <div className="rounded-2xl border border-zinc-800 bg-[#171B26] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BellRing className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-extrabold text-white font-['Plus_Jakarta_Sans']">Próximas Renovaciones</h3>
            <p className="text-xs text-[#9AA6A0]">Las 5 próximas fechas calendarizadas.</p>
          </div>
        </div>
        <div className="space-y-2">
          {upcoming.map(s => {
            const d = daysUntil(s.nextChargeDate);
            const urgent = d >= 0 && d <= 7;
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-[#1C1F2A] p-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-white truncate">{s.name}</p>
                  <p className="text-[11px] text-[#9AA6A0]">{formatDate(s.nextChargeDate)} · {d < 0 ? 'Vencida' : d === 0 ? 'Hoy' : `en ${d} días`}</p>
                </div>
                <span className={`text-sm font-extrabold font-mono whitespace-nowrap ${urgent ? 'text-amber-400' : 'text-white'}`}>{money(s.amount, currencySymbol)}</span>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {suggestions.length > 0 && (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          <div>
            <h3 className="font-extrabold text-white font-['Plus_Jakarta_Sans'] text-sm">Patrones Recurrentes Detectados</h3>
            <p className="text-xs text-[#9AA6A0]">Movimientos con periodicidad detectada que podés registrar como suscripción fija con un clic.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((t, i) => (
            <button key={`${t.title}-${i}`} onClick={() => createFromSuggestion(t)} className="rounded-xl border border-zinc-800 bg-[#171B26] px-3.5 py-2 text-left hover:border-emerald-500/50 transition-colors">
              <p className="text-xs font-bold text-white">{t.title}</p>
              <p className="text-[10px] text-emerald-400 font-mono mt-0.5">{money(t.amount, currencySymbol)} · + Vincular</p>
            </button>
          ))}
        </div>
      </div>
    )}

    <div className="rounded-2xl border border-zinc-800 bg-[#171B26] overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-zinc-800/80">
        <h3 className="font-extrabold text-white font-['Plus_Jakarta_Sans']">Suscripciones en Cartera</h3>
      </div>
      {subscriptions.length === 0 ? (
        <div className="p-8 text-center">
          <CalendarClock className="w-9 h-9 mx-auto text-emerald-400 mb-3" />
          <p className="font-bold text-white">Todavía no registraste suscripciones.</p>
          <p className="text-xs text-[#9AA6A0] mt-1">Servicios de streaming, membresías de gimnasio, software y seguros.</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/60">
          {subscriptions.map(s => {
            const card = cards.find(c => c.id === s.cardId);
            const cat = categories.find(c => c.id === s.categoryId);
            return (
              <div key={s.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/30 transition-colors ${!s.active ? 'opacity-50' : ''}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    <p className="font-bold text-white truncate text-sm">{s.name}</p>
                  </div>
                  <p className="text-[11px] text-[#9AA6A0] mt-1 font-mono">
                    {s.frequency === 'monthly' ? 'Mensual' : 'Anual'} · renovación: {formatDate(s.nextChargeDate)}{cat ? ` · ${cat.name}` : ''}{card ? ` · ${card.name}` : ''}
                  </p>
                  {s.notes && <p className="text-[11px] text-zinc-400 mt-1 truncate">{s.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-extrabold text-white font-mono text-sm sm:text-base">{money(s.amount, currencySymbol)}</p>
                    <p className="text-[10px] text-[#9AA6A0]">{PAYMENT_METHOD_LABELS[s.paymentMethod]}</p>
                  </div>
                  <button onClick={() => openEdit(s)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if (window.confirm(`¿Eliminar la suscripción ${s.name}?`)) onDelete(s.id); }} className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {openForm && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setOpenForm(false)}>
        <form onSubmit={submit} onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#171B26] shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div>
              <h3 className="font-extrabold text-white font-['Plus_Jakarta_Sans']">{editing ? 'Editar Suscripción' : 'Nueva Suscripción'}</h3>
              <p className="text-xs text-[#9AA6A0]">No crea transacciones no autorizadas.</p>
            </div>
            <button type="button" onClick={() => setOpenForm(false)} className="p-2 text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-300">Nombre del Servicio</label>
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Spotify Premium, AWS, Gym" className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#1C1F2A] px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-semibold" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300">Importe recurrente</label>
                <input required type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#1C1F2A] px-3 py-2.5 text-xs text-white font-mono font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-300">Periodicidad</label>
                <select value={frequency} onChange={e => setFrequency(e.target.value as SubscriptionFrequency)} className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#1C1F2A] px-3 py-2.5 text-xs text-white">
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-300">Próxima Fecha de Débito</label>
              <input required type="date" value={nextChargeDate} onChange={e => setNextChargeDate(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#1C1F2A] px-3 py-2.5 text-xs text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300">Categoría</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#1C1F2A] px-3 py-2.5 text-xs text-white">
                  <option value="">Sin categoría</option>
                  {categories.filter(c => c.type === 'expense' || c.type === 'both').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-300">Medio de Pago</label>
                <select value={paymentMethod} onChange={e => { const m = e.target.value as PaymentMethod; setPaymentMethod(m); if (m !== 'tarjeta_credito' && m !== 'tarjeta_debito') setCardId(''); }} className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#1C1F2A] px-3 py-2.5 text-xs text-white">
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(m => <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>)}
                </select>
              </div>
            </div>
            {(paymentMethod === 'tarjeta_credito' || paymentMethod === 'tarjeta_debito') && (
              <div>
                <label className="text-xs font-bold text-zinc-300">Tarjeta Asignada</label>
                <select value={cardId} onChange={e => setCardId(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#1C1F2A] px-3 py-2.5 text-xs text-white">
                  <option value="">Sin asociar</option>
                  {cards.filter(c => c.active && c.type === (paymentMethod === 'tarjeta_credito' ? 'credit' : 'debit')).map(c => <option key={c.id} value={c.id}>{c.name}{c.last4 ? ` · •••• ${c.last4}` : ''}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-zinc-300">Notas u observaciones</label>
              <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej. cancelar si sube de precio..." className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#1C1F2A] px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500" />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button type="button" onClick={() => setOpenForm(false)} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white">Cancelar</button>
              <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs hover:bg-emerald-400">
                <Check className="w-4 h-4" /> Guardar Suscripción
              </button>
            </div>
          </div>
        </form>
      </div>
    )}
  </section>;
};
