import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Landmark, Pencil, Plus, Trash2, TrendingUp, WalletCards } from 'lucide-react';
import { NetWorthSnapshot, PatrimonyItem, PatrimonyItemType } from '../types';

interface PatrimonyProps {
  items: PatrimonyItem[];
  snapshots: NetWorthSnapshot[];
  currencySymbol: string;
  onAdd: (data: Omit<PatrimonyItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (item: PatrimonyItem) => void;
  onDelete: (id: string) => void;
}

const assetCategories = ['Efectivo', 'Cuentas bancarias', 'Inversiones', 'Vehículos', 'Tecnología', 'Propiedad', 'Otros bienes'];
const liabilityCategories = ['Tarjeta de crédito', 'Préstamo', 'Financiación', 'Deuda personal', 'Otros'];
const today = () => new Date().toISOString().slice(0, 10);

const money = (value: number, symbol: string) => `${symbol}${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value)}`;

export const Patrimony: React.FC<PatrimonyProps> = ({ items, snapshots, currencySymbol, onAdd, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState<PatrimonyItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<PatrimonyItemType>('asset');
  const [category, setCategory] = useState(assetCategories[0]);
  const [value, setValue] = useState('');
  const [valuationDate, setValuationDate] = useState(today());
  const [notes, setNotes] = useState('');

  const totals = useMemo(() => ({
    assets: items.filter(i => i.type === 'asset').reduce((s, i) => s + i.value, 0),
    liabilities: items.filter(i => i.type === 'liability').reduce((s, i) => s + i.value, 0),
  }), [items]);
  const netWorth = totals.assets - totals.liabilities;
  const categories = type === 'asset' ? assetCategories : liabilityCategories;
  const sortedItems = [...items].sort((a, b) => b.value - a.value);
  const sortedSnapshots = [...snapshots].sort((a, b) => b.snapshotDate.localeCompare(a.snapshotDate));
  const previousSnapshot = sortedSnapshots[1];
  const variation = previousSnapshot ? netWorth - previousSnapshot.netWorth : null;

  const openNew = () => {
    setEditing(null); setName(''); setType('asset'); setCategory(assetCategories[0]); setValue(''); setValuationDate(today()); setNotes(''); setShowForm(true);
  };
  const openEdit = (item: PatrimonyItem) => {
    setEditing(item); setName(item.name); setType(item.type); setCategory(item.category); setValue(String(item.value)); setValuationDate(item.valuationDate); setNotes(item.notes ?? ''); setShowForm(true);
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const numericValue = Number(value.replace(/\./g, '').replace(',', '.'));
    if (!name.trim() || !Number.isFinite(numericValue) || numericValue < 0) return;
    const data = { name: name.trim(), type, category, value: numericValue, valuationDate, notes: notes.trim() || undefined };
    if (editing) onUpdate({ ...editing, ...data, updatedAt: new Date().toISOString() }); else onAdd(data);
    setShowForm(false);
  };

  return <section className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">5.29 · Patrimonio</p><h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Lo que tenés, no solo lo que gastás.</h2><p className="text-sm text-zinc-400 mt-2 max-w-2xl">Registrá activos y deudas para conocer tu patrimonio neto y empezar a medir su evolución.</p></div>
      <button onClick={openNew} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm"><Plus className="w-4 h-4" />Agregar patrimonio</button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-2xl border border-zinc-800 bg-[#171B26] p-5 shadow-sm"><div className="flex items-center gap-2 text-[#9AA6A0] text-[11px] font-bold uppercase tracking-wider"><WalletCards className="w-4 h-4 text-emerald-400" /> Activos Totales</div><div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-mono">{money(totals.assets, currencySymbol)}</div><p className="text-xs text-[#9AA6A0] mt-1">Capital y bienes computados</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-[#171B26] p-5 shadow-sm"><div className="flex items-center gap-2 text-[#9AA6A0] text-[11px] font-bold uppercase tracking-wider"><Landmark className="w-4 h-4 text-rose-400" /> Pasivos / Deudas</div><div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2 font-mono">{money(totals.liabilities, currencySymbol)}</div><p className="text-xs text-[#9AA6A0] mt-1">Compromisos exigibles</p></div>
      <div className="rounded-2xl border border-emerald-500/30 bg-[#171B26] p-5 shadow-sm"><div className="flex items-center gap-2 text-emerald-400 text-[11px] font-bold uppercase tracking-wider"><TrendingUp className="w-4 h-4 text-emerald-400" /> Patrimonio Neto Soberano</div><div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-2 font-mono font-['Plus_Jakarta_Sans']">{money(netWorth, currencySymbol)}</div><p className={`text-xs mt-1 font-semibold ${variation === null ? 'text-zinc-500' : variation >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{variation === null ? 'Línea base inicial' : `${variation >= 0 ? '+' : ''}${money(variation, currencySymbol)} vs. corte anterior`}</p></div>
    </div>

    {showForm && <form onSubmit={submit} className="rounded-2xl border border-zinc-800 bg-[#171B26] p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between"><h3 className="font-extrabold text-white font-['Plus_Jakarta_Sans']">{editing ? 'Editar registro patrimonial' : 'Nuevo activo o pasivo'}</h3><button type="button" onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-white">Cerrar</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-xs text-zinc-400">Nombre o Entidad<input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Cuenta Remunerada, Bonos, etc." className="mt-1 w-full rounded-xl bg-[#1C1F2A] border border-zinc-800 px-3 py-2.5 text-white outline-none focus:border-emerald-500 text-xs font-semibold" required /></label>
        <label className="text-xs text-zinc-400">Naturaleza<select value={type} onChange={e => { const next = e.target.value as PatrimonyItemType; setType(next); setCategory(next === 'asset' ? assetCategories[0] : liabilityCategories[0]); }} className="mt-1 w-full rounded-xl bg-[#1C1F2A] border border-zinc-800 px-3 py-2.5 text-white text-xs font-semibold"><option value="asset">Activo (Suma)</option><option value="liability">Pasivo / Deuda (Resta)</option></select></label>
        <label className="text-xs text-zinc-400">Categoría<select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full rounded-xl bg-[#1C1F2A] border border-zinc-800 px-3 py-2.5 text-white text-xs font-semibold">{categories.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="text-xs text-zinc-400">Valuación en ARS<input value={value} onChange={e => setValue(e.target.value)} inputMode="decimal" placeholder="0" className="mt-1 w-full rounded-xl bg-[#1C1F2A] border border-zinc-800 px-3 py-2.5 text-white outline-none focus:border-emerald-500 font-mono text-sm font-bold" required /></label>
        <label className="text-xs text-zinc-400">Fecha de tasación<input type="date" value={valuationDate} onChange={e => setValuationDate(e.target.value)} className="mt-1 w-full rounded-xl bg-[#1C1F2A] border border-zinc-800 px-3 py-2.5 text-white text-xs" /></label>
        <label className="text-xs text-zinc-400">Nota u observación<input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej. Rendimiento 40% TNA" className="mt-1 w-full rounded-xl bg-[#1C1F2A] border border-zinc-800 px-3 py-2.5 text-white outline-none focus:border-emerald-500 text-xs" /></label>
      </div>
      <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-800">Cancelar</button><button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-extrabold text-xs hover:bg-emerald-400">Guardar Posición</button></div>
    </form>}

    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 rounded-2xl border border-zinc-800 bg-[#171B26] overflow-hidden shadow-sm"><div className="px-5 py-4 border-b border-zinc-800/80"><h3 className="font-extrabold text-white font-['Plus_Jakarta_Sans']">Posiciones Activas</h3><p className="text-xs text-[#9AA6A0] mt-0.5">Cartera de activos reales y pasivos vinculados.</p></div>{sortedItems.length === 0 ? <div className="p-10 text-center text-[#9AA6A0] text-sm">Todavía no registraste patrimonio. Empezá por tu dinero disponible, cuentas y bienes principales.</div> : <div className="divide-y divide-zinc-800/60">{sortedItems.map(item => <div key={item.id} className="p-4 flex items-center gap-3 hover:bg-zinc-800/30 transition-colors"><div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'asset' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{item.type === 'asset' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}</div><div className="min-w-0 flex-1"><div className="font-bold text-white truncate text-sm">{item.name}</div><div className="text-xs text-[#9AA6A0] mt-0.5">{item.category} · {item.valuationDate}{item.notes ? ` · ${item.notes}` : ''}</div></div><div className={`font-extrabold font-mono text-sm sm:text-base ${item.type === 'asset' ? 'text-emerald-400' : 'text-rose-400'}`}>{item.type === 'asset' ? '+' : '-'}{money(item.value, currencySymbol)}</div><button onClick={() => openEdit(item)} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => onDelete(item.id)} className="p-2 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div>)}</div>}</div>
      <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-[#171B26] overflow-hidden shadow-sm"><div className="px-5 py-4 border-b border-zinc-800/80"><h3 className="font-extrabold text-white font-['Plus_Jakarta_Sans']">Historial de Evolución</h3><p className="text-xs text-[#9AA6A0] mt-0.5">Snapshots de balance patrimonial</p></div>{sortedSnapshots.length === 0 ? <div className="p-8 text-center text-[#9AA6A0] text-sm">Tu primer registro quedará guardado acá para empezar a medir crecimiento.</div> : <div className="divide-y divide-zinc-800/60">{sortedSnapshots.slice(0, 8).map(s => <div key={s.id} className="px-5 py-3.5 flex justify-between items-center hover:bg-zinc-800/30 transition-colors"><span className="text-xs text-[#9AA6A0] font-mono">{s.snapshotDate}</span><span className="font-extrabold text-white font-mono text-sm">{money(s.netWorth, currencySymbol)}</span></div>)}</div>}</div>
    </div>
  </section>;
};
