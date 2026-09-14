import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
      <div className="bg-[#171B26] p-5 rounded-2xl border border-zinc-800 shadow-sm transition-all hover:border-zinc-700 relative overflow-hidden" id="card-income">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6A0]">Ingresos del Período</span>
          <div className="w-9 h-9 rounded-xl bg-[#1C1F2A] border border-zinc-800 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" strokeWidth={2.4} />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white tracking-tight font-mono">{formatCurrency(totalIncome, currencySymbol)}</div>
        <p className="text-xs text-[#9AA6A0] mt-1 font-mono">Entradas consolidadas</p>
      </div>

      <div className="bg-[#171B26] p-5 rounded-2xl border border-zinc-800 shadow-sm transition-all hover:border-zinc-700 relative overflow-hidden" id="card-expenses">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6A0]">Egresos Totales</span>
          <div className="w-9 h-9 rounded-xl bg-[#1C1F2A] border border-zinc-800 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-rose-400" strokeWidth={2.4} />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white tracking-tight font-mono">{formatCurrency(totalExpenses, currencySymbol)}</div>
        <p className="text-xs text-[#9AA6A0] mt-1 font-mono">Desembolsos del mes</p>
      </div>

      <div className="bg-[#171B26] p-5 rounded-2xl border border-zinc-800 shadow-sm transition-all hover:border-zinc-700 relative overflow-hidden" id="card-balance">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6A0]">Flujo Neto</span>
          <div className="w-9 h-9 rounded-xl bg-[#1C1F2A] border border-zinc-800 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-emerald-400" strokeWidth={2.4} />
          </div>
        </div>
        <div className={`text-2xl font-extrabold tracking-tight font-mono ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {formatCurrency(netBalance, currencySymbol)}
        </div>
        <p className="text-xs text-[#9AA6A0] mt-1">{netBalance >= 0 ? 'Superávit acumulado' : 'Déficit del ciclo'}</p>
      </div>

      <div className="bg-[#171B26] p-5 rounded-2xl border border-zinc-800 shadow-sm transition-all hover:border-zinc-700 relative" id="card-budget">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6A0]">Presupuesto</span>
          <button onClick={onEditBudgetClick} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors" title="Editar presupuesto objetivo" id="edit-budget-btn">
            <Target className="w-3.5 h-3.5" strokeWidth={2.2} />
            <span>Ajustar</span>
          </button>
        </div>
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-xl font-extrabold text-white tracking-tight font-mono">{formatCurrency(remainingBudget, currencySymbol)}</div>
          <span className="text-xs font-mono text-[#9AA6A0]">de {formatCurrency(budgetTarget, currencySymbol)}</span>
        </div>
        <div className="w-full bg-[#262A35] rounded-full h-2 my-2 overflow-hidden">
          <div className={`h-2 rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${Math.min(percentageSpent, 100)}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#9AA6A0] font-medium">{remainingBudget >= 0 ? 'Margen libre' : 'Exceso: ' + formatCurrency(Math.abs(remainingBudget), currencySymbol)}</span>
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 ${badgeColor}`}>
            {percentageSpent >= 100 ? (
              <><AlertTriangle className="w-3 h-3" strokeWidth={2.2} /><span>Excedido ({percentageSpent.toFixed(0)}%)</span></>
            ) : percentageSpent >= 85 ? (
              <><AlertTriangle className="w-3 h-3" strokeWidth={2.2} /><span>Al Límite ({percentageSpent.toFixed(0)}%)</span></>
            ) : (
              <><CheckCircle2 className="w-3 h-3" strokeWidth={2.2} /><span>{percentageSpent.toFixed(0)}% usado</span></>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
