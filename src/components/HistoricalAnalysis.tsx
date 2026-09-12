import React from 'react';
import { BarChart3, TrendingDown, TrendingUp, WalletCards, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Category, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface HistoricalAnalysisProps {
  transactions: Transaction[];
  categories?: Category[];
  currencySymbol: string;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const monthKey = (date: string) => date.slice(0, 7);

export const HistoricalAnalysis: React.FC<HistoricalAnalysisProps> = ({ transactions, categories = [], currencySymbol }) => {
  const dated = transactions.filter(tx => /^\d{4}-\d{2}-\d{2}/.test(tx.date));
  const years = [...new Set(dated.map(tx => tx.date.slice(0, 4)))].sort().reverse();
  const selectedYear = years[0] || new Date().getFullYear().toString();
  const yearTransactions = dated.filter(tx => tx.date.startsWith(`${selectedYear}-`));

  const monthly = MONTHS.map((label, index) => {
    const key = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
    const monthTx = yearTransactions.filter(tx => monthKey(tx.date) === key);
    const income = monthTx.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const expense = monthTx.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    return { key, label, income, expense, balance: income - expense };
  });

  const activeMonths = monthly.filter(m => m.income > 0 || m.expense > 0);
  const totalIncome = yearTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = yearTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
  const balance = totalIncome - totalExpense;
  const avgExpense = activeMonths.length ? totalExpense / activeMonths.length : 0;
  const avgIncome = activeMonths.length ? totalIncome / activeMonths.length : 0;
  const highestExpenseMonth = [...monthly].sort((a, b) => b.expense - a.expense)[0];
  const highestIncomeMonth = [...monthly].sort((a, b) => b.income - a.income)[0];

  const categoryTotals: Record<string, number> = {};
  yearTransactions.filter(tx => tx.type === 'expense').forEach(tx => {
    categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + tx.amount;
  });
  const topCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const categoryName = (id: string) => categories.find(c => c.id === id)?.name || id;
  const maxMonthlyValue = Math.max(1, ...monthly.flatMap(m => [m.income, m.expense]));

  // 5.18: use the latest month with real movements as the comparison month.
  // This keeps the analysis correct when historical data is loaded later and
  // avoids depending on the device calendar date.
  const currentMonth = activeMonths[activeMonths.length - 1];
  const comparisonMonthKey = currentMonth?.key || '';
  const historicalMonths = activeMonths.filter(m => m.key !== comparisonMonthKey);
  const historicalAvgExpense = historicalMonths.length ? historicalMonths.reduce((sum, m) => sum + m.expense, 0) / historicalMonths.length : 0;
  const historicalAvgIncome = historicalMonths.length ? historicalMonths.reduce((sum, m) => sum + m.income, 0) / historicalMonths.length : 0;

  const percentageDiff = (current: number, average: number) => average > 0 ? ((current - average) / average) * 100 : 0;
  const expenseDiff = currentMonth ? percentageDiff(currentMonth.expense, historicalAvgExpense) : 0;
  const incomeDiff = currentMonth ? percentageDiff(currentMonth.income, historicalAvgIncome) : 0;

  const categoryCurrentTotals: Record<string, number> = {};
  yearTransactions.filter(tx => tx.type === 'expense' && monthKey(tx.date) === comparisonMonthKey).forEach(tx => {
    categoryCurrentTotals[tx.categoryId] = (categoryCurrentTotals[tx.categoryId] || 0) + tx.amount;
  });

  const previousMonthDate = currentMonth ? new Date(`${currentMonth.key}-01T00:00:00`) : null;
  if (previousMonthDate) previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousKey = previousMonthDate ? monthKey(previousMonthDate.toISOString()) : '';
  const categoryPreviousTotals: Record<string, number> = {};
  yearTransactions.filter(tx => tx.type === 'expense' && monthKey(tx.date) === previousKey).forEach(tx => {
    categoryPreviousTotals[tx.categoryId] = (categoryPreviousTotals[tx.categoryId] || 0) + tx.amount;
  });

  const categoryChanges = Object.keys({ ...categoryCurrentTotals, ...categoryPreviousTotals })
    .map(id => ({ id, current: categoryCurrentTotals[id] || 0, previous: categoryPreviousTotals[id] || 0 }))
    .filter(c => c.current > 0 || c.previous > 0)
    .sort((a, b) => (b.current - b.previous) - (a.current - a.previous));
  const biggestCategoryIncrease = categoryChanges.find(c => c.current > c.previous);

  const comparisonTone = (diff: number, inverse = false) => {
    const positive = inverse ? diff < -5 : diff > 5;
    const negative = inverse ? diff > 5 : diff < -5;
    if (positive) return { text: 'text-orange-400', bg: 'bg-orange-500/10', Icon: ArrowUpRight };
    if (negative) return { text: 'text-rose-400', bg: 'bg-rose-500/10', Icon: ArrowDownRight };
    return { text: 'text-zinc-400', bg: 'bg-zinc-800/60', Icon: Minus };
  };

  const expenseTone = comparisonTone(expenseDiff);
  const incomeTone = comparisonTone(incomeDiff, true);

  return (
    <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-md text-zinc-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-400" strokeWidth={2.4} />
            <h2 className="text-lg font-black text-white">Inteligencia histórica</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Lectura anual de ingresos, gastos, ahorro y patrones de consumo. Se alimenta automáticamente de todos tus movimientos.</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-400">Año analizado: <strong className="text-white">{selectedYear}</strong></div>
      </div>

      {yearTransactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 p-8 text-center">
          <WalletCards className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
          <p className="text-sm font-bold text-zinc-300">Todavía no hay movimientos históricos para analizar.</p>
          <p className="text-xs text-zinc-500 mt-1">Cuando cargues tus movimientos del año, este módulo se completará automáticamente.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"><div className="text-[11px] uppercase tracking-wider font-bold text-zinc-500">Ingresos acumulados</div><div className="mt-2 text-xl font-black text-orange-400">{formatCurrency(totalIncome, currencySymbol)}</div><div className="text-[11px] text-zinc-500 mt-1">Promedio mensual: {formatCurrency(avgIncome, currencySymbol)}</div></div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"><div className="text-[11px] uppercase tracking-wider font-bold text-zinc-500">Gastos acumulados</div><div className="mt-2 text-xl font-black text-rose-400">{formatCurrency(totalExpense, currencySymbol)}</div><div className="text-[11px] text-zinc-500 mt-1">Promedio mensual: {formatCurrency(avgExpense, currencySymbol)}</div></div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"><div className="text-[11px] uppercase tracking-wider font-bold text-zinc-500">Balance acumulado</div><div className={`mt-2 text-xl font-black ${balance >= 0 ? 'text-orange-400' : 'text-rose-400'}`}>{formatCurrency(balance, currencySymbol)}</div><div className="text-[11px] text-zinc-500 mt-1">Ingresos menos gastos</div></div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"><div className="text-[11px] uppercase tracking-wider font-bold text-zinc-500">Tasa de ahorro</div><div className={`mt-2 text-xl font-black ${totalIncome > 0 && balance >= 0 ? 'text-orange-400' : 'text-rose-400'}`}>{totalIncome > 0 ? `${((balance / totalIncome) * 100).toFixed(1)}%` : '—'}</div><div className="text-[11px] text-zinc-500 mt-1">Sobre los ingresos registrados</div></div>
          </div>

          <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-orange-400" /><h3 className="text-sm font-black text-white">Comparación inteligente</h3></div>
            {!currentMonth || !historicalMonths.length ? (
              <div className="text-xs text-zinc-500">Necesito al menos un mes histórico además del mes actual para generar una comparación real.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={`rounded-xl border border-zinc-800 ${expenseTone.bg} p-4`}>
                  <div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Gasto del mes vs. promedio</span><expenseTone.Icon className={`w-4 h-4 ${expenseTone.text}`} /></div>
                  <div className="mt-2 flex items-baseline gap-2"><span className="text-lg font-black text-white">{formatCurrency(currentMonth.expense, currencySymbol)}</span><span className={`text-xs font-black ${expenseTone.text}`}>{expenseDiff >= 0 ? '+' : ''}{expenseDiff.toFixed(1)}%</span></div>
                  <p className="text-[11px] text-zinc-500 mt-1">Promedio de los meses históricos con movimientos: {formatCurrency(historicalAvgExpense, currencySymbol)}</p>
                </div>
                <div className={`rounded-xl border border-zinc-800 ${incomeTone.bg} p-4`}>
                  <div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Ingreso del mes vs. promedio</span><incomeTone.Icon className={`w-4 h-4 ${incomeTone.text}`} /></div>
                  <div className="mt-2 flex items-baseline gap-2"><span className="text-lg font-black text-white">{formatCurrency(currentMonth.income, currencySymbol)}</span><span className={`text-xs font-black ${incomeTone.text}`}>{incomeDiff >= 0 ? '+' : ''}{incomeDiff.toFixed(1)}%</span></div>
                  <p className="text-[11px] text-zinc-500 mt-1">Promedio histórico: {formatCurrency(historicalAvgIncome, currencySymbol)}</p>
                </div>
              </div>
            )}
          </div>

          {biggestCategoryIncrease && (
            <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-orange-400" /><h3 className="text-sm font-black text-white">Tendencia detectada</h3></div>
              <p className="text-xs text-zinc-400 mt-2">Este mes, <strong className="text-white">{categoryName(biggestCategoryIncrease.id)}</strong> aumentó <strong className="text-orange-400">{formatCurrency(biggestCategoryIncrease.current - biggestCategoryIncrease.previous, currencySymbol)}</strong> respecto del mes anterior.</p>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-orange-400" /><h3 className="text-sm font-black text-white">Evolución mensual</h3></div>
              <div className="space-y-3">{monthly.map(m => <div key={m.key} className="grid grid-cols-[32px_1fr_1fr] items-center gap-2"><span className="text-[10px] font-bold text-zinc-500">{m.label}</span><div className="h-2 rounded-full bg-zinc-800 overflow-hidden" title={`Ingresos: ${formatCurrency(m.income, currencySymbol)}`}><div className="h-full bg-orange-500 rounded-full" style={{ width: `${(m.income / maxMonthlyValue) * 100}%` }} /></div><div className="h-2 rounded-full bg-zinc-800 overflow-hidden" title={`Gastos: ${formatCurrency(m.expense, currencySymbol)}`}><div className="h-full bg-rose-500 rounded-full" style={{ width: `${(m.expense / maxMonthlyValue) * 100}%` }} /></div></div>)}</div>
              <div className="mt-3 flex gap-4 text-[10px] text-zinc-500"><span><i className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1" />Ingresos</span><span><i className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1" />Gastos</span></div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="flex items-center gap-2 mb-4"><TrendingDown className="w-4 h-4 text-rose-400" /><h3 className="text-sm font-black text-white">Dónde mirar primero</h3></div>
              <div className="space-y-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3"><div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Mes de mayor gasto</div><div className="mt-1 text-sm font-black text-zinc-100">{highestExpenseMonth?.label}</div><div className="text-xs text-rose-400 font-bold mt-0.5">{formatCurrency(highestExpenseMonth?.expense || 0, currencySymbol)}</div></div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3"><div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Mes de mayor ingreso</div><div className="mt-1 text-sm font-black text-zinc-100">{highestIncomeMonth?.label}</div><div className="text-xs text-orange-400 font-bold mt-0.5">{formatCurrency(highestIncomeMonth?.income || 0, currencySymbol)}</div></div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3"><div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Categorías con mayor peso</div><div className="mt-2 space-y-2">{topCategories.length === 0 ? <span className="text-xs text-zinc-500">Sin gastos categorizados.</span> : topCategories.map(([id, amount], index) => <div key={id} className="flex items-center justify-between text-xs"><span className="text-zinc-400">#{index + 1} {categoryName(id)}</span><span className="font-black text-zinc-200">{formatCurrency(amount, currencySymbol)}</span></div>)}</div></div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
