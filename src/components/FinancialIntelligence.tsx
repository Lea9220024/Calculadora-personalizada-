import React from 'react';
import { Activity, CalendarClock, Gauge, TrendingUp } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface FinancialIntelligenceProps {
  currentMonthKey: string;
  budgetTarget: number;
  transactions: Transaction[];
  currencySymbol: string;
}

const getMonthDays = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

export const FinancialIntelligence: React.FC<FinancialIntelligenceProps> = ({
  currentMonthKey,
  budgetTarget,
  transactions,
  currencySymbol
}) => {
  const [year, month] = currentMonthKey.split('-').map(Number);
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const daysInMonth = getMonthDays(currentMonthKey);

  const expenses = transactions.filter(tx => tx.type === 'expense');
  const totalSpent = expenses.reduce((sum, tx) => sum + tx.amount, 0);
  const remaining = Math.max(0, budgetTarget - totalSpent);

  const elapsedDays = isCurrentMonth
    ? Math.min(daysInMonth, Math.max(1, now.getDate()))
    : year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)
      ? daysInMonth
      : 0;

  const daysRemaining = isCurrentMonth ? Math.max(0, daysInMonth - elapsedDays) : 0;
  const dailySpendRate = elapsedDays > 0 ? totalSpent / elapsedDays : 0;
  const projectedClose = isCurrentMonth ? dailySpendRate * daysInMonth : totalSpent;
  const availablePerDay = isCurrentMonth && daysRemaining > 0 ? remaining / daysRemaining : 0;

  const projectionDelta = budgetTarget > 0 ? projectedClose - budgetTarget : 0;
  const paceVsBudget = budgetTarget > 0 && elapsedDays > 0
    ? (totalSpent / budgetTarget) - (elapsedDays / daysInMonth)
    : 0;

  const metricCards = [
    {
      icon: CalendarClock,
      label: 'Disponible por día',
      value: isCurrentMonth && budgetTarget > 0 && daysRemaining > 0
        ? formatCurrency(availablePerDay, currencySymbol)
        : budgetTarget > 0 ? '—' : 'Definí un presupuesto',
      detail: isCurrentMonth ? `${daysRemaining} días restantes` : 'Solo aplica al mes en curso',
      tone: availablePerDay >= dailySpendRate ? 'text-orange-400' : 'text-rose-400'
    },
    {
      icon: Activity,
      label: 'Ritmo de gasto',
      value: formatCurrency(dailySpendRate, currencySymbol),
      detail: elapsedDays > 0 ? `${elapsedDays} días contabilizados` : 'Todavía no comenzó el mes',
      tone: 'text-zinc-100'
    },
    {
      icon: TrendingUp,
      label: 'Proyección de cierre',
      value: formatCurrency(projectedClose, currencySymbol),
      detail: budgetTarget > 0
        ? projectionDelta > 0
          ? `≈ ${formatCurrency(projectionDelta, currencySymbol)} por encima`
          : `≈ ${formatCurrency(Math.abs(projectionDelta), currencySymbol)} por debajo`
        : 'Sin presupuesto de referencia',
      tone: projectionDelta > 0 ? 'text-rose-400' : 'text-orange-400'
    },
    {
      icon: Gauge,
      label: 'Ritmo vs. objetivo',
      value: budgetTarget > 0
        ? `${Math.abs(paceVsBudget * 100).toFixed(0)}% ${paceVsBudget > 0 ? 'por encima' : paceVsBudget < 0 ? 'por debajo' : 'en línea'}`
        : 'Sin referencia',
      detail: budgetTarget > 0 ? 'Comparado con el avance ideal del mes' : 'Definí un presupuesto global',
      tone: paceVsBudget > 0.02 ? 'text-rose-400' : 'text-orange-400'
    }
  ];

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-md">
      <div className="flex flex-col gap-1 mb-5">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-orange-400" strokeWidth={2.4} />
          <h2 className="text-lg font-black text-white">Inteligencia financiera</h2>
        </div>
        <p className="text-xs text-zinc-400">
          El presupuesto ahora te muestra el ritmo de gasto y qué nivel de gasto podés sostener hasta fin de mes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {metricCards.map(({ icon: Icon, label, value, detail, tone }) => (
          <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 min-h-[118px]">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-zinc-500">
              <Icon className="w-4 h-4" strokeWidth={2.2} />
              {label}
            </div>
            <div className={`mt-3 text-xl font-black tracking-tight ${tone}`}>{value}</div>
            <div className="mt-1 text-[11px] leading-4 text-zinc-500">{detail}</div>
          </div>
        ))}
      </div>

      {isCurrentMonth && budgetTarget > 0 && (
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <span className="text-zinc-400">
            Gastaste <strong className="text-zinc-200">{formatCurrency(totalSpent, currencySymbol)}</strong> de <strong className="text-zinc-200">{formatCurrency(budgetTarget, currencySymbol)}</strong>.
          </span>
          <span className={projectionDelta > 0 ? 'text-rose-400 font-bold' : 'text-orange-400 font-bold'}>
            {projectionDelta > 0
              ? 'Si mantenés este ritmo, vas a superar el presupuesto.'
              : 'Si mantenés este ritmo, cerrás dentro del presupuesto.'}
          </span>
        </div>
      )}
    </section>
  );
};
