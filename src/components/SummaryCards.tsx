import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { GradientIcon } from './GradientIcon';
import { formatCurrency } from '../utils/formatters';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  budgetTarget: number;
  currencySymbol: string;
  onEditBudgetClick: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ totalIncome, totalExpenses, budgetTarget, currencySymbol, onEditBudgetClick }) => {
  const netBalance = totalIncome - totalExpenses;
  const remainingBudget = budgetTarget - totalExpenses;
  const percentageSpent = budgetTarget > 0 ? (totalExpenses / budgetTarget) * 100 : 0;
  let progressColor = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (percentageSpent >= 100) { progressColor = 'bg-rose-500'; badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30'; }
  else if (percentageSpent >= 85) { progressColor = 'bg-amber-500'; badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30'; }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-md transition-all hover:border-zinc-700 relative overflow-hidden" id="card-income">
        <div className="flex items-center justify-between mb-3"><span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ingresos del Mes</span><div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center"><GradientIcon icon={TrendingUp} className="w-5 h-5" strokeWidth={2.4} /></div></div>
        <div className="text-2xl font-black text-zinc-100 tracking-tight">{formatCurrency(totalIncome, currencySymbol)}</div><p className="text-xs text-zinc-500 mt-1">Total ingresado en este mes</p>
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
      </div>
      <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-md transition-all hover:border-zinc-700 relative overflow-hidden" id="card-expenses">
        <div className="flex items-center justify-between mb-3"><span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Gastos Totales</span><div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center"><GradientIcon icon={TrendingDown} className="w-5 h-5" strokeWidth={2.4} /></div></div>
        <div className="text-2xl font-black text-zinc-100 tracking-tight">{formatCurrency(totalExpenses, currencySymbol)}</div><p className="text-xs text-zinc-500 mt-1">Total egresado en este mes</p>
        <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
      </div>
      <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-md transition-all hover:border-zinc-700 relative overflow-hidden" id="card-balance">
        <div className="flex items-center justify-between mb-3"><span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Balance Neto</span><div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center"><GradientIcon icon={Wallet} className="w-5 h-5" strokeWidth={2.4} /></div></div>
        <div className={`text-2xl font-black tracking-tight ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(netBalance, currencySymbol)}</div><p className="text-xs text-zinc-500 mt-1">{netBalance >= 0 ? 'Superávit disponible' : 'Déficit del mes'}</p>
      </div>
      <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-md transition-all hover:border-zinc-700 relative" id="card-budget">
        <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Presupuesto</span><button onClick={onEditBudgetClick} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors" title="Editar presupuesto objetivo" id="edit-budget-btn"><GradientIcon icon={Target} className="w-3.5 h-3.5" strokeWidth={2.2} /><span>Ajustar</span></button></div>
        <div className="flex items-baseline justify-between mb-1"><div className="text-xl font-black text-zinc-100 tracking-tight">{formatCurrency(remainingBudget, currencySymbol)}</div><span className="text-xs font-medium text-zinc-500">de {formatCurrency(budgetTarget, currencySymbol)}</span></div>
        <div className="w-full bg-zinc-800 rounded-full h-2 my-2 overflow-hidden"><div className={`h-2 rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${Math.min(percentageSpent, 100)}%` }} /></div>
        <div className="flex items-center justify-between text-xs"><span className="text-zinc-400 font-medium">{remainingBudget >= 0 ? 'Disponible' : 'Excedido por ' + formatCurrency(Math.abs(remainingBudget), currencySymbol)}</span><span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold flex items-center gap-1 ${badgeColor}`}>{percentageSpent >= 100 ? (<><GradientIcon icon={AlertTriangle} className="w-3 h-3" strokeWidth={2.2} /><span>Excedido ({percentageSpent.toFixed(0)}%)</span></>) : percentageSpent >= 85 ? (<><GradientIcon icon={AlertTriangle} className="w-3 h-3" strokeWidth={2.2} /><span>Cerca del Límite ({percentageSpent.toFixed(0)}%)</span></>) : (<><GradientIcon icon={CheckCircle2} className="w-3 h-3" strokeWidth={2.2} /><span>{percentageSpent.toFixed(0)}% usado</span></>)}</span></div>
      </div>
    </div>
  );
};
