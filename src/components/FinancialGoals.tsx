import React, { useEffect, useMemo, useState } from 'react';
import { Target, Plus, Pencil, Trash2, CalendarDays, WalletCards, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Transaction } from '../types';

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  createdAt: string;
}

interface FinancialGoalsProps {
  transactions: Transaction[];
  currencySymbol: string;
}

const STORAGE_KEY = 'mis_gastos_financial_goals_v1';

const emptyForm = {
  name: '',
  targetAmount: '',
  currentAmount: '',
  targetDate: ''
};

const formatMoney = (value: number, symbol: string) =>
  `${symbol}${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Math.round(value))}`;

const daysUntil = (date: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
};

const monthsUntil = (date: string) => Math.max(1, Math.ceil(daysUntil(date) / 30.4375));

export const FinancialGoals: React.FC<FinancialGoalsProps> = ({ transactions, currencySymbol }) => {
  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  const monthlySurplus = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return income - expenses;
  }, [transactions]);

  const summary = useMemo(() => ({
    target: goals.reduce((s, g) => s + g.targetAmount, 0),
    saved: goals.reduce((s, g) => s + Math.min(g.currentAmount, g.targetAmount), 0)
  }), [goals]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsOpen(true);
  };

  const openEdit = (goal: FinancialGoal) => {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      targetDate: goal.targetDate
    });
    setIsOpen(true);
  };

  const saveGoal = (event: React.FormEvent) => {
    event.preventDefault();
    const targetAmount = Number(form.targetAmount);
    const currentAmount = Number(form.currentAmount || 0);
    if (!form.name.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0 || !form.targetDate) return;

    const cleanCurrent = Math.max(0, Math.min(currentAmount, targetAmount));
    if (editingId) {
      setGoals(prev => prev.map(g => g.id === editingId ? {
        ...g,
        name: form.name.trim(),
        targetAmount,
        currentAmount: cleanCurrent,
        targetDate: form.targetDate
      } : g));
    } else {
      setGoals(prev => [...prev, {
        id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: form.name.trim(),
        targetAmount,
        currentAmount: cleanCurrent,
        targetDate: form.targetDate,
        createdAt: new Date().toISOString()
      }]);
    }
    setIsOpen(false);
    setForm(emptyForm);
  };

  const deleteGoal = (id: string) => {
    if (window.confirm('¿Eliminar este objetivo financiero?')) {
      setGoals(prev => prev.filter(g => g.id !== id));
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 sm:p-6 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-orange-400">
            <Target size={20} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">5.23 · Planificación</span>
          </div>
          <h2 className="mt-1 text-xl font-semibold text-zinc-100">Objetivos financieros</h2>
          <p className="mt-1 text-sm text-zinc-500">Convertí lo que querés lograr en una meta con fecha y ritmo de ahorro.</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-orange-400">
          <Plus size={17} /> Nuevo objetivo
        </button>
      </div>

      {goals.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs text-zinc-500">Objetivos</p><p className="mt-1 text-lg font-semibold">{goals.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs text-zinc-500">Acumulado</p><p className="mt-1 text-lg font-semibold text-emerald-400">{formatMoney(summary.saved, currencySymbol)}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs text-zinc-500">Falta alcanzar</p><p className="mt-1 text-lg font-semibold text-orange-400">{formatMoney(Math.max(0, summary.target - summary.saved), currencySymbol)}</p>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-800 p-8 text-center">
          <Target className="mx-auto text-zinc-700" size={32} />
          <p className="mt-3 font-medium text-zinc-300">Todavía no tenés objetivos creados.</p>
          <p className="mt-1 text-sm text-zinc-500">Podés empezar con un viaje, fondo de emergencia, mudanza o cualquier meta personal.</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {goals.map(goal => {
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            const days = daysUntil(goal.targetDate);
            const months = monthsUntil(goal.targetDate);
            const monthlyRequired = remaining / months;
            const dailyRequired = days > 0 ? remaining / days : remaining;
            const completed = remaining <= 0;
            const overdue = !completed && days < 0;
            const onTrack = !completed && !overdue && monthlySurplus > 0 && monthlySurplus >= monthlyRequired;
            const status = completed ? 'Completado' : overdue ? 'Vencido' : onTrack ? 'En ritmo' : 'Requiere ajuste';
            const StatusIcon = completed ? CheckCircle2 : overdue ? AlertTriangle : CheckCircle2;

            return (
              <article key={goal.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-zinc-100">{goal.name}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500"><CalendarDays size={14} /> Meta: {new Date(`${goal.targetDate}T00:00:00`).toLocaleDateString('es-AR')}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(goal)} aria-label="Editar objetivo" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"><Pencil size={16} /></button>
                    <button onClick={() => deleteGoal(goal.id)} aria-label="Eliminar objetivo" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="mt-5 flex items-end justify-between gap-3">
                  <div><p className="text-2xl font-bold">{formatMoney(goal.currentAmount, currencySymbol)}</p><p className="text-xs text-zinc-500">de {formatMoney(goal.targetAmount, currencySymbol)}</p></div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${completed ? 'bg-emerald-500/10 text-emerald-400' : overdue ? 'bg-red-500/10 text-red-400' : onTrack ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                    <StatusIcon size={13} /> {status}
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} /></div>
                <div className="mt-2 flex justify-between text-xs"><span className="text-zinc-400">{progress.toFixed(0)}% alcanzado</span><span className="text-zinc-500">Faltan {formatMoney(remaining, currencySymbol)}</span></div>

                {!completed && <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-zinc-950 p-3"><p className="text-[11px] text-zinc-500">Ahorro mensual requerido</p><p className="mt-1 text-sm font-semibold text-zinc-200">{formatMoney(monthlyRequired, currencySymbol)}</p></div>
                  <div className="rounded-lg bg-zinc-950 p-3"><p className="text-[11px] text-zinc-500">Ahorro diario requerido</p><p className="mt-1 text-sm font-semibold text-zinc-200">{formatMoney(dailyRequired, currencySymbol)}</p></div>
                </div>}

                <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500"><WalletCards size={14} /> {completed ? 'Objetivo alcanzado.' : days >= 0 ? `${days} días restantes` : `Vencido hace ${Math.abs(days)} días`}</div>
              </article>
            );
          })}
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}>
        <form onSubmit={saveGoal} className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
          <h3 className="text-lg font-semibold">{editingId ? 'Editar objetivo' : 'Nuevo objetivo'}</h3>
          <div className="mt-5 space-y-4">
            <label className="block"><span className="text-xs text-zinc-500">Nombre</span><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Viaje" className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-orange-500" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-xs text-zinc-500">Monto objetivo</span><input required min="1" type="number" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-orange-500" /></label>
              <label className="block"><span className="text-xs text-zinc-500">Ya acumulado</span><input min="0" type="number" value={form.currentAmount} onChange={e => setForm({ ...form, currentAmount: e.target.value })} className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-orange-500" /></label>
            </div>
            <label className="block"><span className="text-xs text-zinc-500">Fecha objetivo</span><input required type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-orange-500" /></label>
          </div>
          <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setIsOpen(false)} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-900">Cancelar</button><button type="submit" className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400">Guardar objetivo</button></div>
        </form>
      </div>}
    </section>
  );
};
