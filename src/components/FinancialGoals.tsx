import React, { useEffect, useMemo, useState } from 'react';
import { Target, Plus, Pencil, Trash2, CalendarDays, WalletCards, CheckCircle2, AlertTriangle, Calculator, TrendingDown } from 'lucide-react';
import { Transaction } from '../types';

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  createdAt: string;
}

interface FinancialGoalsProps { transactions: Transaction[]; currencySymbol: string; }
const STORAGE_KEY = 'mis_gastos_financial_goals_v1';
const emptyForm = { name: '', targetAmount: '', currentAmount: '', targetDate: '' };
const formatMoney = (value: number, symbol: string) => `${symbol}${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Math.round(value))}`;
const daysUntil = (date: string) => { const today = new Date(); today.setHours(0,0,0,0); return Math.ceil((new Date(`${date}T00:00:00`).getTime() - today.getTime()) / 86400000); };
const monthsUntil = (date: string) => Math.max(1, Math.ceil(daysUntil(date) / 30.4375));

export const FinancialGoals: React.FC<FinancialGoalsProps> = ({ transactions, currencySymbol }) => {
  const [goals, setGoals] = useState<FinancialGoal[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : []; } catch { return []; } });
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simGoalId, setSimGoalId] = useState('');
  const [simMonthlySaving, setSimMonthlySaving] = useState('');
  const [simExpenseReduction, setSimExpenseReduction] = useState('0');

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(goals)); }, [goals]);

  const monthlySurplus = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
    return income - expenses;
  }, [transactions]);

  const summary = useMemo(() => ({ target: goals.reduce((s,g)=>s+g.targetAmount,0), saved: goals.reduce((s,g)=>s+Math.min(g.currentAmount,g.targetAmount),0) }), [goals]);
  const selectedSimGoal = goals.find(g => g.id === simGoalId) || goals[0];
  const simulation = useMemo(() => {
    if (!selectedSimGoal) return null;
    const remaining = Math.max(0, selectedSimGoal.targetAmount - selectedSimGoal.currentAmount);
    const manual = Number(simMonthlySaving);
    const reduction = Math.min(100, Math.max(0, Number(simExpenseReduction) || 0));
    const currentExpenses = transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const monthlySavingsFromReduction = currentExpenses * reduction / 100;
    const availableSurplus = Math.max(0, monthlySurplus) + monthlySavingsFromReduction;
    const planned = Number.isFinite(manual) && manual > 0 ? manual : availableSurplus;
    const targetDays = daysUntil(selectedSimGoal.targetDate);
    const monthsNeeded = planned > 0 ? Math.ceil(remaining / planned) : null;
    const projectedDate = planned > 0 ? new Date(new Date().getTime() + monthsNeeded! * 30.4375 * 86400000) : null;
    const requiredMonthly = remaining / monthsUntil(selectedSimGoal.targetDate);
    return { remaining, reduction, monthlySavingsFromReduction, availableSurplus, planned, targetDays, monthsNeeded, projectedDate, requiredMonthly };
  }, [selectedSimGoal, simMonthlySaving, simExpenseReduction, monthlySurplus, transactions]);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setIsOpen(true); };
  const openEdit = (goal: FinancialGoal) => { setEditingId(goal.id); setForm({name:goal.name,targetAmount:String(goal.targetAmount),currentAmount:String(goal.currentAmount),targetDate:goal.targetDate}); setIsOpen(true); };
  const saveGoal = (event: React.FormEvent) => {
    event.preventDefault(); const targetAmount=Number(form.targetAmount); const currentAmount=Number(form.currentAmount||0);
    if(!form.name.trim() || !Number.isFinite(targetAmount) || targetAmount<=0 || !form.targetDate) return;
    const cleanCurrent=Math.max(0,Math.min(currentAmount,targetAmount));
    if(editingId) setGoals(prev=>prev.map(g=>g.id===editingId?{...g,name:form.name.trim(),targetAmount,currentAmount:cleanCurrent,targetDate:form.targetDate}:g));
    else setGoals(prev=>[...prev,{id:`goal-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:form.name.trim(),targetAmount,currentAmount:cleanCurrent,targetDate:form.targetDate,createdAt:new Date().toISOString()}]);
    setIsOpen(false); setForm(emptyForm);
  };
  const deleteGoal = (id:string) => { if(window.confirm('¿Eliminar este objetivo financiero?')) setGoals(prev=>prev.filter(g=>g.id!==id)); };

  return <section className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">PLANIFICACIÓN ESTRATÉGICA</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-['Plus_Jakarta_Sans']">Objetivos Financieros</h2>
        <p className="text-sm text-[#9AA6A0] mt-1">Convertí lo que querés lograr en una meta de capital cuantificada con fecha límite y ritmo de acumulación.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={()=>{setSimulatorOpen(true);setSimGoalId(goals[0]?.id||'');}} disabled={goals.length===0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-[#171B26] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">
          <Calculator size={15} className="text-emerald-400" /> Simular Escenarios
        </button>
        <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-black transition hover:bg-emerald-400">
          <Plus size={15} strokeWidth={3} /> Nuevo Objetivo
        </button>
      </div>
    </div>

    {goals.length>0 && (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-[#171B26] p-5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-[#9AA6A0]">Objetivos Trazados</p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-white font-mono">{goals.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#171B26] p-5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-[#9AA6A0]">Capital Acumulado</p>
          <p className="mt-1 text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">{formatMoney(summary.saved,currencySymbol)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#171B26] p-5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-[#9AA6A0]">Faltante por Consolidar</p>
          <p className="mt-1 text-xl sm:text-2xl font-extrabold text-white font-mono">{formatMoney(Math.max(0,summary.target-summary.saved),currencySymbol)}</p>
        </div>
      </div>
    )}

    {goals.length===0 ? (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#171B26]/50 p-10 text-center">
        <Target className="mx-auto text-emerald-400/60 mb-3" size={36}/>
        <p className="font-bold text-white">Todavía no tenés metas financieras registradas.</p>
        <p className="mt-1 text-xs text-[#9AA6A0]">Fondo de reserva, inversiones inmobiliarias, retiro o proyectos de capital.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {goals.map(goal=>{
          const remaining=Math.max(0,goal.targetAmount-goal.currentAmount);
          const progress=Math.min(100,(goal.currentAmount/goal.targetAmount)*100);
          const days=daysUntil(goal.targetDate);
          const months=monthsUntil(goal.targetDate);
          const monthlyRequired=remaining/months;
          const dailyRequired=days>0?remaining/days:remaining;
          const completed=remaining<=0;
          const overdue=!completed&&days<0;
          const onTrack=!completed&&!overdue&&monthlySurplus>0&&monthlySurplus>=monthlyRequired;
          const status=completed?'Completado':overdue?'Vencido':onTrack?'En ritmo':'Requiere ajuste';
          const StatusIcon=completed||onTrack?CheckCircle2:AlertTriangle;

          return (
            <article key={goal.id} className="rounded-2xl border border-zinc-800 bg-[#171B26] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-white font-['Plus_Jakarta_Sans'] text-base">{goal.name}</h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[#9AA6A0]">
                    <CalendarDays size={13} className="text-emerald-400"/> Fecha meta: {new Date(`${goal.targetDate}T00:00:00`).toLocaleDateString('es-AR')}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>openEdit(goal)} aria-label="Editar objetivo" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"><Pencil size={15}/></button>
                  <button onClick={()=>deleteGoal(goal.id)} aria-label="Eliminar objetivo" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-rose-400"><Trash2 size={15}/></button>
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-extrabold text-white font-mono">{formatMoney(goal.currentAmount,currencySymbol)}</p>
                  <p className="text-xs text-[#9AA6A0] mt-0.5">Meta: {formatMoney(goal.targetAmount,currencySymbol)}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${completed?'bg-emerald-500/10 text-emerald-400':overdue?'bg-rose-500/10 text-rose-400':onTrack?'bg-emerald-500/10 text-emerald-400':'bg-amber-500/10 text-amber-400'}`}>
                  <StatusIcon size={13}/> {status}
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#262A35]">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{width:`${progress}%`}}/>
              </div>

              <div className="mt-2 flex justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">{progress.toFixed(0)}% consolidado</span>
                <span className="text-[#9AA6A0]">Faltan {formatMoney(remaining,currencySymbol)}</span>
              </div>

              {!completed && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-[#1C1F2A] border border-zinc-800/80 p-3">
                    <p className="text-[10px] uppercase font-bold text-[#9AA6A0]">Ahorro Mensual Req.</p>
                    <p className="mt-1 text-sm font-extrabold text-white font-mono">{formatMoney(monthlyRequired,currencySymbol)}</p>
                  </div>
                  <div className="rounded-xl bg-[#1C1F2A] border border-zinc-800/80 p-3">
                    <p className="text-[10px] uppercase font-bold text-[#9AA6A0]">Ahorro Diario Req.</p>
                    <p className="mt-1 text-sm font-extrabold text-white font-mono">{formatMoney(dailyRequired,currencySymbol)}</p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-[#9AA6A0]">
                <WalletCards size={14} className="text-emerald-400"/>
                {completed?'Objetivo alcanzado con éxito.':days>=0?`${days} días restantes para la fecha límite`:`Vencido hace ${Math.abs(days)} días`}
              </div>
            </article>
          );
        })}
      </div>
    )}

    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setIsOpen(false)}}>
        <form onSubmit={saveGoal} className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#171B26] p-6 shadow-2xl">
          <h3 className="text-lg font-extrabold text-white font-['Plus_Jakarta_Sans']">{editingId?'Editar Objetivo':'Nuevo Objetivo Financiero'}</h3>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-zinc-300">Nombre del Objetivo</span>
              <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej. Fondo de Emergencia 6 Meses" className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#1C1F2A] px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-semibold"/>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-bold text-zinc-300">Monto Meta</span>
                <input required min="1" type="number" value={form.targetAmount} onChange={e=>setForm({...form,targetAmount:e.target.value})} className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#1C1F2A] px-3 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500"/>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-zinc-300">Capital Acumulado</span>
                <input min="0" type="number" value={form.currentAmount} onChange={e=>setForm({...form,currentAmount:e.target.value})} className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#1C1F2A] px-3 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500"/>
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-bold text-zinc-300">Fecha Límite</span>
              <input required type="date" value={form.targetDate} onChange={e=>setForm({...form,targetDate:e.target.value})} className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#1C1F2A] px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"/>
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={()=>setIsOpen(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white">Cancelar</button>
            <button type="submit" className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-black hover:bg-emerald-400">Guardar Objetivo</button>
          </div>
        </form>
      </div>
    )}

    {simulatorOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setSimulatorOpen(false)}}>
        <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#171B26] p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400"><Calculator size={18}/><span className="text-xs font-bold uppercase tracking-[0.18em]">SIMULADOR DE CAPITAL</span></div>
              <h3 className="mt-1 text-xl font-extrabold text-white font-['Plus_Jakarta_Sans']">Proyección de Escenarios</h3>
              <p className="mt-1 text-xs text-[#9AA6A0]">Simulá incrementos de ahorro y optimización de gastos sin alterar tus registros contables.</p>
            </div>
            <button onClick={()=>setSimulatorOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-zinc-300">Objetivo a Analizar</span>
              <select value={simGoalId} onChange={e=>setSimGoalId(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#1C1F2A] px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500">
                {goals.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-zinc-300">Ahorro Mensual Adicional Voluntario</span>
              <input type="number" min="0" value={simMonthlySaving} onChange={e=>setSimMonthlySaving(e.target.value)} placeholder="0 (usa superávit actual de la cartera)" className="mt-1 w-full rounded-xl border border-zinc-800 bg-[#1C1F2A] px-3 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500"/>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-zinc-300">Reducción Simulada de Gastos Operativos</span>
              <div className="mt-1 flex items-center gap-3">
                <input type="range" min="0" max="50" step="1" value={simExpenseReduction} onChange={e=>setSimExpenseReduction(e.target.value)} className="w-full accent-emerald-500"/>
                <span className="w-12 text-right text-xs font-extrabold text-emerald-400 font-mono">{simExpenseReduction}%</span>
              </div>
            </label>
          </div>

          {simulation && (
            <div className="mt-5 rounded-xl border border-zinc-800 bg-[#1C1F2A] p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#9AA6A0]">Ahorro Mensual Simulado</p>
                  <p className="mt-1 text-lg font-extrabold text-emerald-400 font-mono">{formatMoney(simulation.planned,currencySymbol)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#9AA6A0]">Necesario para la Fecha</p>
                  <p className="mt-1 text-lg font-extrabold text-white font-mono">{formatMoney(simulation.requiredMonthly,currencySymbol)}</p>
                </div>
              </div>
              {simulation.monthsNeeded!==null ? (
                <>
                  <div className="mt-4 rounded-xl bg-[#171B26] border border-zinc-800/80 p-3">
                    <p className="text-xs text-[#9AA6A0]">Fecha estimada de cumplimiento:</p>
                    <p className="mt-1 font-bold text-white text-sm font-mono">{simulation.projectedDate?.toLocaleDateString('es-AR')} ({simulation.monthsNeeded} {simulation.monthsNeeded===1?'mes':'meses'})</p>
                  </div>
                  <div className={`mt-3 flex items-center gap-2 text-xs font-semibold ${simulation.monthsNeeded*30.4375<=simulation.targetDays?'text-emerald-400':'text-amber-400'}`}>
                    <TrendingDown size={14}/> {simulation.monthsNeeded*30.4375<=simulation.targetDays?'El plan simulado alcanza la meta dentro del plazo.':'Con este ritmo se superará la fecha estimada original.'}
                  </div>
                </>
              ) : (
                <div className="mt-4 flex items-center gap-2 text-xs text-amber-400">
                  <AlertTriangle size={14}/> No hay superávit mensual proyectado para estimar la fecha.
                </div>
              )}
            </div>
          )}
          <p className="mt-4 text-[11px] text-[#9AA6A0]">La simulación es un modelo de proyección: no altera saldos reales ni transacciones.</p>
        </div>
      </div>
    )}
  </section>;
};
