import React from 'react';
import { Activity, AlertTriangle, CalendarClock, CheckCircle2, Gauge, Lightbulb, TrendingDown, TrendingUp, Sparkles } from 'lucide-react';
import { Category, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface FinancialIntelligenceProps {
  currentMonthKey: string;
  budgetTarget: number;
  categoryTargets?: Record<string, number>;
  transactions: Transaction[];
  categories?: Category[];
  currencySymbol: string;
}

const getMonthDays = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

const readLocalJson = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    return fallback;
  }
};

export const FinancialIntelligence: React.FC<FinancialIntelligenceProps> = ({
  currentMonthKey,
  budgetTarget,
  categoryTargets,
  transactions,
  categories,
  currencySymbol
}) => {
  const localCategories = categories || readLocalJson<Category[]>('mis_gastos_categories_v1', []);
  const localBudgets = readLocalJson<Array<{ monthKey: string; totalTarget: number; categoryTargets: Record<string, number> }>>('mis_gastos_budgets_v1', []);
  const resolvedCategoryTargets = categoryTargets || localBudgets.find(b => b.monthKey === currentMonthKey)?.categoryTargets || {};

  const [year, month] = currentMonthKey.split('-').map(Number);
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const daysInMonth = getMonthDays(currentMonthKey);

  const expenses = transactions.filter(tx => tx.type === 'expense');
  const incomes = transactions.filter(tx => tx.type === 'income');
  const totalSpent = expenses.reduce((sum, tx) => sum + tx.amount, 0);
  const totalIncome = incomes.reduce((sum, tx) => sum + tx.amount, 0);
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

  const categoryInsights = Object.entries(expenseByCategory)
    .map(([categoryId, spent]) => {
      const category = localCategories.find(c => c.id === categoryId);
      const target = resolvedCategoryTargets[categoryId] || 0;
      const deviation = target > 0 ? spent - target : 0;
      const percentage = target > 0 ? (spent / target) * 100 : 0;
      return { categoryId, name: category?.name || 'Sin categoría', spent, target, deviation, percentage };
    })
    .sort((a, b) => b.deviation - a.deviation);

  const biggestDeviation = categoryInsights.find(item => item.target > 0 && item.deviation > 0);
  const bestControlled = [...categoryInsights]
    .filter(item => item.target > 0 && item.spent <= item.target)
    .sort((a, b) => (a.spent / a.target) - (b.spent / b.target))[0];

  // 5.22: presupuesto inteligente. La recomendación es informativa y nunca modifica el presupuesto guardado.
  const incomeBasedTarget = totalIncome > 0 ? totalIncome * 0.8 : 0;
  const smartTarget = budgetTarget > 0 ? budgetTarget : incomeBasedTarget;
  const smartDailyTarget = isCurrentMonth && daysInMonth > 0 ? smartTarget / daysInMonth : 0;
  const currentDailyGap = smartDailyTarget - dailySpendRate;
  const categoryRecommendations = Object.entries(expenseByCategory)
    .map(([categoryId, spent]) => {
      const share = totalSpent > 0 ? spent / totalSpent : 0;
      const recommended = smartTarget > 0 ? smartTarget * share : 0;
      const category = localCategories.find(c => c.id === categoryId);
      return { categoryId, name: category?.name || 'Sin categoría', spent, recommended, share };
    })
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);
  const smartStatus = smartTarget <= 0 ? 'sin-datos' : totalSpent <= smartTarget ? 'controlado' : 'excedido';

  const metricCards = [
    { icon: CalendarClock, label: 'Disponible por día', value: isCurrentMonth && budgetTarget > 0 && daysRemaining > 0 ? formatCurrency(availablePerDay, currencySymbol) : budgetTarget > 0 ? '—' : 'Definí un presupuesto', detail: isCurrentMonth ? `${daysRemaining} días restantes` : 'Solo aplica al mes en curso', tone: availablePerDay >= dailySpendRate ? 'text-orange-400' : 'text-rose-400' },
    { icon: Activity, label: 'Ritmo de gasto', value: formatCurrency(dailySpendRate, currencySymbol), detail: elapsedDays > 0 ? `${elapsedDays} días contabilizados` : 'Todavía no comenzó el mes', tone: 'text-zinc-100' },
    { icon: TrendingUp, label: 'Proyección de cierre', value: formatCurrency(projectedClose, currencySymbol), detail: budgetTarget > 0 ? projectionOver ? `≈ ${formatCurrency(projectionDelta, currencySymbol)} por encima` : `≈ ${formatCurrency(Math.abs(projectionDelta), currencySymbol)} por debajo` : 'Sin presupuesto de referencia', tone: projectionOver ? 'text-rose-400' : 'text-orange-400' },
    { icon: Gauge, label: 'Ritmo vs. objetivo', value: budgetTarget > 0 ? `${Math.abs(pacePercent).toFixed(0)}% ${pacePercent > 2 ? 'por encima' : pacePercent < -2 ? 'por debajo' : 'en línea'}` : 'Sin referencia', detail: budgetTarget > 0 ? 'Comparado con el avance ideal del mes' : 'Definí un presupuesto global', tone: pacePercent > 2 ? 'text-rose-400' : 'text-orange-400' }
  ];

  const alert = !budgetTarget || !isCurrentMonth ? null : projectionOver ? { icon: AlertTriangle, title: 'Estás gastando demasiado rápido', text: `A este ritmo proyectás superar tu presupuesto en ${formatCurrency(projectionDelta, currencySymbol)}.`, tone: 'border-rose-500/30 bg-rose-500/10 text-rose-300' } : { icon: CheckCircle2, title: 'Vas dentro del presupuesto', text: `A este ritmo proyectás cerrar ${formatCurrency(Math.abs(projectionDelta), currencySymbol)} por debajo del objetivo.`, tone: 'border-orange-500/30 bg-orange-500/10 text-orange-300' };

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-md">
      <div className="flex flex-col gap-1 mb-5">
        <div className="flex items-center gap-2"><Gauge className="w-5 h-5 text-orange-400" strokeWidth={2.4} /><h2 className="text-lg font-black text-white">Inteligencia financiera</h2></div>
        <p className="text-xs text-zinc-400">El presupuesto interpreta tu comportamiento y te señala dónde prestar atención.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {metricCards.map(({ icon: Icon, label, value, detail, tone }) => <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 min-h-[118px]"><div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-zinc-500"><Icon className="w-4 h-4" strokeWidth={2.2} />{label}</div><div className={`mt-3 text-xl font-black tracking-tight ${tone}`}>{value}</div><div className="mt-1 text-[11px] leading-4 text-zinc-500">{detail}</div></div>)}
      </div>

      {alert && <div className={`mt-4 rounded-2xl border px-4 py-3 flex items-start gap-3 ${alert.tone}`}><alert.icon className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={2.2} /><div><div className="text-sm font-black">{alert.title}</div><div className="text-xs mt-0.5 opacity-90">{alert.text}</div></div></div>}

      <div className="mt-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
        <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-orange-400" /><h3 className="text-sm font-black text-white">Presupuesto inteligente</h3><span className="ml-auto text-[9px] uppercase tracking-wider font-bold text-orange-400">Recomendación</span></div>
        <p className="text-[11px] text-zinc-400 mt-1">Calcula un objetivo de gasto sin modificar tu presupuesto guardado. Si existe un presupuesto manual, lo toma como referencia; si no, propone hasta el 80% de los ingresos registrados.</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3"><div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Objetivo sugerido</div><div className="mt-1 text-lg font-black text-orange-400">{smartTarget > 0 ? formatCurrency(smartTarget, currencySymbol) : '—'}</div><div className="text-[10px] text-zinc-500 mt-1">{budgetTarget > 0 ? 'Basado en tu presupuesto actual' : totalIncome > 0 ? '80% de tus ingresos registrados' : 'Necesito ingresos o presupuesto'}</div></div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3"><div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Límite diario sugerido</div><div className="mt-1 text-lg font-black text-zinc-100">{smartDailyTarget > 0 ? formatCurrency(smartDailyTarget, currencySymbol) : '—'}</div><div className="text-[10px] text-zinc-500 mt-1">Distribución uniforme del objetivo mensual</div></div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3"><div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Estado</div><div className={`mt-1 text-lg font-black ${smartStatus === 'excedido' ? 'text-rose-400' : smartStatus === 'controlado' ? 'text-orange-400' : 'text-zinc-400'}`}>{smartStatus === 'excedido' ? 'Por encima' : smartStatus === 'controlado' ? 'Controlado' : 'Sin datos'}</div><div className="text-[10px] text-zinc-500 mt-1">{smartStatus === 'excedido' ? `Exceso actual: ${formatCurrency(totalSpent - smartTarget, currencySymbol)}` : smartStatus === 'controlado' ? `Margen: ${formatCurrency(smartTarget - totalSpent, currencySymbol)}` : 'Completá ingresos o presupuesto'}</div></div>
        </div>
        {smartTarget > 0 && isCurrentMonth && <div className={`mt-3 rounded-xl border px-3 py-2 text-[11px] ${currentDailyGap >= 0 ? 'border-orange-500/20 bg-orange-500/5 text-zinc-400' : 'border-rose-500/20 bg-rose-500/5 text-zinc-400'}`}>{currentDailyGap >= 0 ? <>Tu ritmo actual está <strong className="text-orange-300">{formatCurrency(currentDailyGap, currencySymbol)}</strong> por debajo del límite diario sugerido.</> : <>Tu ritmo actual está <strong className="text-rose-300">{formatCurrency(Math.abs(currentDailyGap), currencySymbol)}</strong> por encima del límite diario sugerido.</>}</div>}
        {categoryRecommendations.length > 0 && <div className="mt-4"><div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-2">Distribución sugerida por categoría</div><div className="space-y-2">{categoryRecommendations.map(item => <div key={item.categoryId} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"><div className="flex justify-between gap-3 text-xs"><span className="font-bold text-zinc-200 truncate">{item.name}</span><span className="font-black text-zinc-300">{formatCurrency(item.recommended, currencySymbol)}</span></div><div className="mt-1 text-[10px] text-zinc-500">Hoy representa {(item.share * 100).toFixed(0)}% del gasto · gastado {formatCurrency(item.spent, currencySymbol)}</div></div>)}</div></div>}
      </div>

      {isCurrentMonth && budgetTarget > 0 && <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3"><div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 flex items-start gap-3"><Lightbulb className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" /><div className="text-xs text-zinc-400">{availablePerDay > 0 ? <>Podés gastar hasta <strong className="text-zinc-200">{formatCurrency(availablePerDay, currencySymbol)}</strong> por día para mantenerte dentro del presupuesto.</> : <>El presupuesto ya fue consumido. Cualquier gasto adicional aumenta el desvío.</>}</div></div>{topCategory && <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 flex items-start gap-3"><TrendingUp className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" /><div className="text-xs text-zinc-400">Tu categoría con mayor gasto concentra aproximadamente <strong className="text-zinc-200">{topCategoryShare.toFixed(0)}%</strong> del gasto del mes.</div></div>}</div>}

      {categoryInsights.length > 0 && <div className="mt-5 pt-5 border-t border-zinc-800"><div className="flex items-center justify-between mb-3"><div><h3 className="text-sm font-black text-white">Dónde ajustar</h3><p className="text-[11px] text-zinc-500">Comparación entre gasto real y objetivo por categoría.</p></div>{biggestDeviation && <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Mayor desvío</span>}</div><div className="space-y-2.5">{categoryInsights.slice(0, 5).map(item => { const ratio = item.target > 0 ? Math.min(100, item.percentage) : 0; const over = item.target > 0 && item.spent > item.target; return <div key={item.categoryId} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-zinc-200 truncate">{item.name}</span><div className="text-right shrink-0"><span className={`text-xs font-black ${over ? 'text-rose-400' : 'text-orange-400'}`}>{formatCurrency(item.spent, currencySymbol)}</span>{item.target > 0 && <span className="text-[10px] text-zinc-500"> / {formatCurrency(item.target, currencySymbol)}</span>}</div></div>{item.target > 0 ? <><div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden"><div className={`h-full rounded-full ${over ? 'bg-rose-500' : 'bg-orange-500'}`} style={{ width: `${ratio}%` }} /></div><div className="mt-1.5 flex justify-between text-[10px] text-zinc-500"><span>{item.percentage.toFixed(0)}% del objetivo</span><span className={over ? 'text-rose-400 font-bold' : 'text-zinc-400'}>{over ? `+${formatCurrency(item.deviation, currencySymbol)}` : `${formatCurrency(Math.max(0, item.target - item.spent), currencySymbol)} disponibles`}</span></div></> : <div className="mt-1.5 text-[10px] text-zinc-500">Sin objetivo definido para esta categoría.</div>}</div>; })}</div>{biggestDeviation ? <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-rose-400 shrink-0" /><span className="text-[11px] text-zinc-400">El principal desvío está en <strong className="text-zinc-200">{biggestDeviation.name}</strong>: llevás <strong className="text-rose-300">{formatCurrency(biggestDeviation.deviation, currencySymbol)}</strong> por encima del objetivo.</span></div> : bestControlled ? <div className="mt-3 rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" /><span className="text-[11px] text-zinc-400">Buen control en <strong className="text-zinc-200">{bestControlled.name}</strong>: estás usando solo <strong className="text-zinc-200">{bestControlled.percentage.toFixed(0)}%</strong> de su objetivo.</span></div> : null}</div>}
    </section>
  );
};