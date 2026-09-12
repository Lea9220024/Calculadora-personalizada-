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
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase"><WalletCards className="w-4 h-4" /> Activos</div><div className="text-2xl font-extrabold text-white mt-3">{money(totals.assets, currencySymbol)}</div><p className="text-xs text-zinc-500 mt-1">Lo que poseés</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"><div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase"><Landmark className="w-4 h-4" /> Deudas</div><div className="text-2xl font-extrabold text-white mt-3">{money(totals.liabilities, currencySymbol)}</div><p className="text-xs text-zinc-500 mt-1">Lo que debés</p></div>
      <div className="rounded-2xl border border-emerald-500/30 bg-zinc-950 p-5"><div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase"><TrendingUp className="w-4 h-4" /> Patrimonio neto</div><div className="text-3xl font-extrabold text-white mt-3">{money(netWorth, currencySymbol)}</div><p className={`text-xs mt-1 ${variation === null ? 'text-zinc-500' : variation >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{variation === null ? 'Primer registro' : `${variation >= 0 ? '+' : ''}${money(variation, currencySymbol)} vs. último registro`}</p></div>
    </div>

    {showForm && <form onSubmit={submit} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
      <div className="flex items-center justify-between"><h3 className="font-extrabold text-white">{editing ? 'Editar registro' : 'Nuevo registro'}</h3><button type="button" onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white">Cerrar</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-xs text-zinc-400">Nombre<input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Cuenta sueldo" className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white outline-none focus:border-emerald-500" required /></label>
        <label className="text-xs text-zinc-400">Tipo<select value={type} onChange={e => { const next = e.target.value as PatrimonyItemType; setType(next); setCategory(next === 'asset' ? assetCategories[0] : liabilityCategories[0]); }} className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white"><option value="asset">Activo</option><option value="liability">Pasivo / deuda</option></select></label>
        <label className="text-xs text-zinc-400">Categoría<select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white">{categories.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="text-xs text-zinc-400">Valor actual<input value={value} onChange={e => setValue(e.target.value)} inputMode="decimal" placeholder="0" className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white outline-none focus:border-emerald-500" required /></label>
        <label className="text-xs text-zinc-400">Fecha de valuación<input type="date" value={valuationDate} onChange={e => setValuationDate(e.target.value)} className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white" /></label>
        <label className="text-xs text-zinc-400">Nota opcional<input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detalle" className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white outline-none focus:border-emerald-500" /></label>
      </div>
      <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-300">Cancelar</button><button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-extrabold">Guardar</button></div>
    </form>}

    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden"><div className="px-5 py-4 border-b border-zinc-800"><h3 className="font-extrabold text-white">Tus registros</h3><p className="text-xs text-zinc-500 mt-1">Actualizalos cuando cambie su valor.</p></div>{sortedItems.length === 0 ? <div className="p-10 text-center text-zinc-500 text-sm">Todavía no registraste patrimonio. Empezá por tu dinero disponible, cuentas y bienes principales.</div> : <div className="divide-y divide-zinc-800/80">{sortedItems.map(item => <div key={item.id} className="p-4 flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'asset' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{item.type === 'asset' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}</div><div className="min-w-0 flex-1"><div className="font-bold text-zinc-100 truncate">{item.name}</div><div className="text-xs text-zinc-500">{item.category} · {item.valuationDate}{item.notes ? ` · ${item.notes}` : ''}</div></div><div className={`font-extrabold ${item.type === 'asset' ? 'text-emerald-400' : 'text-red-400'}`}>{item.type === 'asset' ? '+' : '-'}{money(item.value, currencySymbol)}</div><button onClick={() => openEdit(item)} className="p-2 text-zinc-500 hover:text-white"><Pencil className="w-4 h-4" /></button><button onClick={() => onDelete(item.id)} className="p-2 text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button></div>)}</div>}</div>
      <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden"><div className="px-5 py-4 border-b border-zinc-800"><h3 className="font-extrabold text-white">Evolución</h3><p className="text-xs text-zinc-500 mt-1">Historial de patrimonio neto</p></div>{sortedSnapshots.length === 0 ? <div className="p-8 text-center text-zinc-500 text-sm">Tu primer registro quedará guardado acá para empezar a medir crecimiento.</div> : <div className="divide-y divide-zinc-800/80">{sortedSnapshots.slice(0, 8).map(s => <div key={s.id} className="px-5 py-3 flex justify-between items-center"><span className="text-xs text-zinc-500">{s.snapshotDate}</span><span className="font-bold text-zinc-100">{money(s.netWorth, currencySymbol)}</span></div>)}</div>}</div>
    </div>
  </section>;
};
