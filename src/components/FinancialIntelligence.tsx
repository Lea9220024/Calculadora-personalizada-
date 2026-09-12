import React from 'react';
import { Activity, AlertTriangle, CalendarClock, CheckCircle2, Gauge, Lightbulb, TrendingUp } from 'lucide-react';
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
  const pacePercent = paceVsBudget * 100;
  const projectionOver = projectionDelta > 0;

  const expenseByCategory = expenses.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.categoryId] = (acc[tx.categoryId] || 0) + tx.amount;
    return acc;
  }, {});
  const topCategory = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0];
  const topCategoryShare = totalSpent > 0 && topCategory ? (topCategory[1] / totalSpent) * 100 : 0;

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
        ? projectionOver
          ? `≈ ${formatCurrency(projectionDelta, currencySymbol)} por encima`
          : `≈ ${formatCurrency(Math.abs(projectionDelta), currencySymbol)} por debajo`
        : 'Sin presupuesto de referencia',
      tone: projectionOver ? 'text-rose-400' : 'text-orange-400'
    },
    {
      icon: Gauge,
      label: 'Ritmo vs. objetivo',
      value: budgetTarget > 0
        ? `${Math.abs(pacePercent).toFixed(0)}% ${pacePercent > 0 ? 'por encima' : pacePercent < 0 ? 'por debajo' : 'en línea'}`
        : 'Sin referencia',
      detail: budgetTarget > 0 ? 'Comparado con el avance ideal del mes' : 'Definí un presupuesto global',
      tone: pacePercent > 2 ? 'text-rose-400' : 'text-orange-400'
    }
  ];

  const alert = !budgetTarget || !isCurrentMonth
    ? null
    : projectionOver
      ? {
          icon: AlertTriangle,
          title: 'Estás gastando demasiado rápido',
          text: `A este ritmo proyectás superar tu presupuesto en ${formatCurrency(projectionDelta, currencySymbol)}.`,
          tone: 'border-rose-500/30 bg-rose-500/10 text-rose-300'
        }
      : {
          icon: CheckCircle2,
          title: 'Vas dentro del presupuesto',
          text: `A este ritmo proyectás cerrar ${formatCurrency(Math.abs(projectionDelta), currencySymbol)} por debajo del objetivo.`,
          tone: 'border-orange-500/30 bg-orange-500/10 text-orange-300'
        };

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-md">
      <div className="flex flex-col gap-1 mb-5">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-orange-400" strokeWidth={2.4} />
          <h2 className="text-lg font-black text-white">Inteligencia financiera</h2>
        </div>
        <p className="text-xs text-zinc-400">
          El presupuesto ahora interpreta tu comportamiento y te avisa cuando el ritmo de gasto requiere atención.
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

      {alert && (
        <div className={`mt-4 rounded-2xl border px-4 py-3 flex items-start gap-3 ${alert.tone}`}>
          <alert.icon className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={2.2} />
          <div>
            <div className="text-sm font-black">{alert.title}</div>
            <div className="text-xs mt-0.5 opacity-90">{alert.text}</div>
          </div>
        </div>
      )}

      {isCurrentMonth && budgetTarget > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
            <div className="text-xs text-zinc-400">
              {availablePerDay > 0
                ? <>Podés gastar hasta <strong className="text-zinc-200">{formatCurrency(availablePerDay, currencySymbol)}</strong> por día para mantenerte dentro del presupuesto.</>
                : <>El presupuesto ya fue consumido. Cualquier gasto adicional aumenta el desvío.</>}
            </div>
          </div>

          {topCategory && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 flex items-start gap-3">
              <TrendingUp className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
              <div className="text-xs text-zinc-400">
                Tu categoría con mayor gasto concentra aproximadamente <strong className="text-zinc-200">{topCategoryShare.toFixed(0)}%</strong> del gasto del mes.
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
