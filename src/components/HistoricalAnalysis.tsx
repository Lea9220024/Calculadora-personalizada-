import React from 'react';
import { BarChart3, TrendingDown, TrendingUp, WalletCards, ArrowUpRight, ArrowDownRight, Minus, Repeat2, AlertTriangle, Search, ShieldCheck, Target, PiggyBank, Activity } from 'lucide-react';
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

  const trendCandidates = Object.keys(categoryTotals).map(id => {
    const values = monthly.map(m => yearTransactions
      .filter(tx => tx.type === 'expense' && tx.categoryId === id && monthKey(tx.date) === m.key)
      .reduce((sum, tx) => sum + tx.amount, 0));
    return { id, values };
  });

  const categoryTrends = trendCandidates.flatMap(({ id, values }) => {
    const results: { id: string; direction: 'up' | 'down'; change: number; months: string[] }[] = [];
    for (let i = 2; i < values.length; i++) {
      const window = values.slice(i - 2, i + 1);
      if (window.every(v => v > 0) && window[0] < window[1] && window[1] < window[2]) {
        results.push({ id, direction: 'up', change: ((window[2] - window[0]) / window[0]) * 100, months: monthly.slice(i - 2, i + 1).map(m => m.label) });
      }
      if (window.every(v => v > 0) && window[0] > window[1] && window[1] > window[2]) {
        results.push({ id, direction: 'down', change: ((window[0] - window[2]) / window[0]) * 100, months: monthly.slice(i - 2, i + 1).map(m => m.label) });
      }
    }
    return results;
  });

  const latestTrendByCategory = new Map<string, typeof categoryTrends[number]>();
  categoryTrends.forEach(trend => latestTrendByCategory.set(trend.id, trend));
  const detectedTrends = [...latestTrendByCategory.values()]
    .filter(t => t.change >= 5)
    .sort((a, b) => b.change - a.change)
    .slice(0, 4);

  const expenseMonthlyValues = monthly.map(m => m.expense);
  const expenseTrendWindows: { direction: 'up' | 'down'; change: number; months: string[] }[] = [];
  for (let i = 2; i < expenseMonthlyValues.length; i++) {
    const window = expenseMonthlyValues.slice(i - 2, i + 1);
    if (window.every(v => v > 0) && window[0] < window[1] && window[1] < window[2]) {
      expenseTrendWindows.push({ direction: 'up', change: ((window[2] - window[0]) / window[0]) * 100, months: monthly.slice(i - 2, i + 1).map(m => m.label) });
    }
    if (window.every(v => v > 0) && window[0] > window[1] && window[1] > window[2]) {
      expenseTrendWindows.push({ direction: 'down', change: ((window[0] - window[2]) / window[0]) * 100, months: monthly.slice(i - 2, i + 1).map(m => m.label) });
    }
  }
  const latestExpenseTrend = expenseTrendWindows.length ? expenseTrendWindows[expenseTrendWindows.length - 1] : undefined;

  const expenseTransactions = yearTransactions.filter(tx => tx.type === 'expense');
  const titleKey = (title: string) => title.trim().toLowerCase().replace(/\s+/g, ' ');
  const titleGroups = new Map<string, Transaction[]>();
  expenseTransactions.forEach(tx => {
    const key = titleKey(tx.title);
    if (!key) return;
    const group = titleGroups.get(key) || [];
    group.push(tx);
    titleGroups.set(key, group);
  });

  const recurringPatterns = [...titleGroups.entries()]
    .map(([key, items]) => {
      const months = new Set(items.map(tx => monthKey(tx.date)));
      const avg = items.reduce((sum, tx) => sum + tx.amount, 0) / items.length;
      return { key, items, months: months.size, avg };
    })
    .filter(g => g.items.length >= 3 && g.months >= 2)
    .sort((a, b) => b.months - a.months || b.items.length - a.items.length)
    .slice(0, 4);

  const categoryMonthlyHistory = Object.keys(categoryTotals).map(id => {
    const values = activeMonths.map(m => yearTransactions
      .filter(tx => tx.type === 'expense' && tx.categoryId === id && monthKey(tx.date) === m.key)
      .reduce((sum, tx) => sum + tx.amount, 0));
    return { id, values };
  });

  const extraordinaryCandidates = expenseTransactions.map(tx => {
    const categoryHistory = categoryMonthlyHistory.find(c => c.id === tx.categoryId)?.values || [];
    const positive = categoryHistory.filter(v => v > 0);
    const baseline = positive.length > 1 ? positive.reduce((sum, v) => sum + v, 0) / positive.length : 0;
    return { tx, baseline, ratio: baseline > 0 ? tx.amount / baseline : 0 };
  }).filter(x => x.baseline > 0 && x.ratio >= 1.75 && x.tx.amount >= 1000)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3);

  const smallExpenseThreshold = Math.max(1500, Math.min(5000, avgExpense * 0.025));
  const smallExpenseGroups = [...titleGroups.entries()].map(([key, items]) => ({
    key,
    count: items.length,
    total: items.reduce((sum, tx) => sum + tx.amount, 0),
    avg: items.reduce((sum, tx) => sum + tx.amount, 0) / items.length,
    months: new Set(items.map(tx => monthKey(tx.date))).size,
  })).filter(g => g.count >= 3 && g.avg <= smallExpenseThreshold && g.months >= 2)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const latestExpense = currentMonth?.expense || 0;
  const latestIncome = currentMonth?.income || 0;
  const latestSavingsRate = latestIncome > 0 ? ((latestIncome - latestExpense) / latestIncome) * 100 : (latestExpense > 0 ? -100 : 0);
  const historicalSavingsRates = historicalMonths
    .filter(m => m.income > 0)
    .map(m => ((m.income - m.expense) / m.income) * 100);
  const referenceSavingsRate = historicalSavingsRates.length
    ? historicalSavingsRates.reduce((sum, value) => sum + value, 0) / historicalSavingsRates.length
    : latestSavingsRate;

  const savingsPoints = referenceSavingsRate >= 30 ? 25 : referenceSavingsRate >= 20 ? 20 : referenceSavingsRate >= 10 ? 15 : referenceSavingsRate >= 0 ? 8 : 0;
  const spendingPoints = historicalMonths.length
    ? expenseDiff <= 5 ? 20 : expenseDiff <= 10 ? 16 : expenseDiff <= 20 ? 10 : expenseDiff <= 30 ? 5 : 2
    : latestIncome > 0 && latestExpense <= latestIncome ? 15 : latestExpense === 0 ? 10 : 3;
  const budgetPoints = 10;
  const budgetReason = 'Factor presupuestario neutral para no penalizarte por falta de datos.';

  const incomeValues = activeMonths.filter(m => m.income > 0).map(m => m.income);
  const incomeStability = incomeValues.length >= 2
    ? (() => {
        const mean = incomeValues.reduce((sum, value) => sum + value, 0) / incomeValues.length;
        const variance = incomeValues.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / incomeValues.length;
        const coefficient = mean > 0 ? Math.sqrt(variance) / mean : 1;
        return coefficient <= 0.10 ? 15 : coefficient <= 0.20 ? 12 : coefficient <= 0.35 ? 9 : coefficient <= 0.50 ? 6 : 3;
      })()
    : latestIncome > 0 ? 10 : 3;

  const recurringAmount = recurringPatterns.reduce((sum, group) => sum + group.items.reduce((inner, tx) => inner + tx.amount, 0), 0);
  const recurringRatio = totalExpense > 0 ? recurringAmount / totalExpense : 0;
  const recurringPoints = recurringRatio <= 0.40 ? 10 : recurringRatio <= 0.60 ? 8 : recurringRatio <= 0.75 ? 5 : 2;

  const riskCount = extraordinaryCandidates.length + smallExpenseGroups.length + detectedTrends.filter(t => t.direction === 'up').length;
  const riskPoints = riskCount === 0 ? 10 : riskCount <= 2 ? 7 : riskCount <= 4 ? 4 : 1;

  const rawScore = savingsPoints + spendingPoints + budgetPoints + incomeStability + recurringPoints + riskPoints;
  const availableMax = 25 + 20 + 20 + 15 + 10 + 10;
  const score = Math.max(0, Math.min(100, Math.round((rawScore / availableMax) * 100)));
  const scoreLabel = score >= 85 ? 'Excelente' : score >= 70 ? 'Saludable' : score >= 55 ? 'Atención' : 'Requiere acción';
  const scoreTone = score >= 85 ? 'text-emerald-400' : score >= 70 ? 'text-emerald-400' : score >= 55 ? 'text-amber-400' : 'text-rose-400';
  const scoreBarTone = score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-emerald-500' : score >= 55 ? 'bg-amber-500' : 'bg-rose-500';
  const scoreFactors = [
    { label: 'Capacidad de ahorro', points: savingsPoints, max: 25, icon: PiggyBank, reason: `${referenceSavingsRate.toFixed(1)}% de ahorro de referencia.` },
    { label: 'Control del gasto', points: spendingPoints, max: 20, icon: Activity, reason: historicalMonths.length ? `Gasto actual ${expenseDiff >= 0 ? '+' : ''}${expenseDiff.toFixed(1)}% vs. promedio histórico.` : 'Se toma el balance del mes disponible.' },
    { label: 'Presupuesto', points: budgetPoints, max: 20, icon: Target, reason: budgetReason },
    { label: 'Estabilidad de ingresos', points: incomeStability, max: 15, icon: TrendingUp, reason: incomeValues.length >= 2 ? 'Basado en la variación de los ingresos mensuales.' : 'Preliminar: pocos períodos registrados.' },
    { label: 'Peso recurrente', points: recurringPoints, max: 10, icon: Repeat2, reason: totalExpense > 0 ? `${(recurringRatio * 100).toFixed(1)}% del gasto detectado como recurrente.` : 'Sin egresos computables.' },
    { label: 'Riesgo de fugas/anomalías', points: riskPoints, max: 10, icon: ShieldCheck, reason: riskCount === 0 ? 'No se detectaron señales críticas con el historial disponible.' : `${riskCount} señal${riskCount === 1 ? '' : 'es'} detectada${riskCount === 1 ? '' : 's'}.` },
  ];
  const weakestFactor = [...scoreFactors].sort((a, b) => (a.points / a.max) - (b.points / b.max))[0];
  const strongestFactor = [...scoreFactors].sort((a, b) => (b.points / b.max) - (a.points / a.max))[0];
  const scorePreliminary = activeMonths.length < 2;

  const comparisonTone = (diff: number, inverse = false) => {
    const positive = inverse ? diff < -5 : diff > 5;
    const negative = inverse ? diff > 5 : diff < -5;
    if (positive) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', Icon: ArrowUpRight };
    if (negative) return { text: 'text-rose-400', bg: 'bg-rose-500/10', Icon: ArrowDownRight };
    return { text: 'text-[#9AA6A0]', bg: 'bg-zinc-800/60', Icon: Minus };
  };

  const expenseTone = comparisonTone(expenseDiff);
  const incomeTone = comparisonTone(incomeDiff, true);
  const readableTitle = (key: string) => key.length > 34 ? `${key.slice(0, 34)}…` : key;

  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-[#171B26] p-5 sm:p-6 shadow-sm text-zinc-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" strokeWidth={2.4} />
            <h2 className="text-xl font-extrabold text-white font-['Plus_Jakarta_Sans']">Inteligencia Histórica Anual</h2>
          </div>
          <p className="text-xs text-[#9AA6A0] mt-1">Auditoría consolidada de ingresos, ahorro estructural y evolución intermensual de hábitos.</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#1C1F2A] px-3.5 py-2 text-xs text-[#9AA6A0]">
          Año bajo análisis: <strong className="text-white font-mono">{selectedYear}</strong>
        </div>
      </div>

      {yearTransactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-[#1C1F2A]/50 p-8 text-center">
          <WalletCards className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
          <p className="text-sm font-bold text-zinc-300">Sin movimientos históricos en este ejercicio.</p>
          <p className="text-xs text-[#9AA6A0] mt-1">A medida que registres movimientos a lo largo del año, la serie histórica se consolidará automáticamente.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-[#1C1F2A] p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-[#9AA6A0]">Ingresos Acumulados</div>
              <div className="mt-2 text-xl font-extrabold text-emerald-400 font-mono">{formatCurrency(totalIncome, currencySymbol)}</div>
              <div className="text-[11px] text-[#9AA6A0] mt-1 font-mono">Promedio: {formatCurrency(avgIncome, currencySymbol)}/mes</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-[#1C1F2A] p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-[#9AA6A0]">Egresos Acumulados</div>
              <div className="mt-2 text-xl font-extrabold text-white font-mono">{formatCurrency(totalExpense, currencySymbol)}</div>
              <div className="text-[11px] text-[#9AA6A0] mt-1 font-mono">Promedio: {formatCurrency(avgExpense, currencySymbol)}/mes</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-[#1C1F2A] p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-[#9AA6A0]">Flujo Neto Anual</div>
              <div className={`mt-2 text-xl font-extrabold font-mono ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(balance, currencySymbol)}
              </div>
              <div className="text-[11px] text-[#9AA6A0] mt-1">Resultado neto acumulado</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-[#1C1F2A] p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-[#9AA6A0]">Tasa de Ahorro Real</div>
              <div className={`mt-2 text-xl font-extrabold font-mono ${totalIncome > 0 && balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalIncome > 0 ? `${((balance / totalIncome) * 100).toFixed(1)}%` : '—'}
              </div>
              <div className="text-[11px] text-[#9AA6A0] mt-1 font-mono">Sobre ingresos auditados</div>
            </div>
          </div>

          {/* Sovereign Health Score */}
          <div className="mt-5 rounded-2xl border border-zinc-800 bg-[#1C1F2A] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-extrabold text-white font-['Plus_Jakarta_Sans']">Score de Salud Financiera</h3>
                </div>
                <p className="text-xs text-[#9AA6A0] mt-0.5">Indicador de solvencia y solidez conductual computado en tiempo real (0 a 100).</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-extrabold font-mono leading-none ${scoreTone}`}>{score}</div>
                <div className={`text-[10px] font-extrabold uppercase tracking-wider mt-1 font-mono ${scoreTone}`}>{scoreLabel}</div>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-[#262A35] overflow-hidden">
              <div className={`h-full rounded-full ${scoreBarTone} transition-all`} style={{ width: `${score}%` }} />
            </div>
            {scorePreliminary && (
              <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
                Score <strong>preliminar</strong>: el cómputo se afianzará a medida que cargues más meses continuos.
              </div>
            )}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {scoreFactors.map(factor => {
                const Icon = factor.icon;
                const pct = (factor.points / factor.max) * 100;
                return (
                  <div key={factor.label} className="rounded-xl border border-zinc-800 bg-[#171B26] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-zinc-200 truncate">{factor.label}</span>
                      </div>
                      <span className="text-xs font-extrabold text-white font-mono">{factor.points}/{factor.max}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-[#262A35] overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-[#9AA6A0] mt-2 leading-relaxed">{factor.reason}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 font-mono">Foco de Optimización</div>
                <p className="text-xs text-zinc-300 mt-1"><strong className="text-white">{weakestFactor.label}</strong>: mayor potencial de mejora para robustecer tu score.</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-[#171B26] p-3">
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#9AA6A0] font-mono">Pilar de Mayor Solidez</div>
                <p className="text-xs text-zinc-300 mt-1"><strong className="text-white">{strongestFactor.label}</strong>: máxima consistencia en tus registros históricos.</p>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="mt-5 rounded-2xl border border-zinc-800 bg-[#1C1F2A] p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-extrabold text-white font-['Plus_Jakarta_Sans']">Auditoría Comparativa de Desviación</h3>
            </div>
            {!currentMonth || !historicalMonths.length ? (
              <div className="text-xs text-[#9AA6A0]">Se requieren al menos dos ciclos para contrastar la media intermensual.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={`rounded-xl border border-zinc-800 ${expenseTone.bg} p-4`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#9AA6A0]">Gasto del Período vs Media</span>
                    <expenseTone.Icon className={`w-4 h-4 ${expenseTone.text}`} />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-white font-mono">{formatCurrency(currentMonth.expense, currencySymbol)}</span>
                    <span className={`text-xs font-extrabold font-mono ${expenseTone.text}`}>{expenseDiff >= 0 ? '+' : ''}{expenseDiff.toFixed(1)}%</span>
                  </div>
                  <p className="text-[11px] text-[#9AA6A0] mt-1 font-mono">Media histórica: {formatCurrency(historicalAvgExpense, currencySymbol)}</p>
                </div>
                <div className={`rounded-xl border border-zinc-800 ${incomeTone.bg} p-4`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#9AA6A0]">Ingreso del Período vs Media</span>
                    <incomeTone.Icon className={`w-4 h-4 ${incomeTone.text}`} />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-white font-mono">{formatCurrency(currentMonth.income, currencySymbol)}</span>
                    <span className={`text-xs font-extrabold font-mono ${incomeTone.text}`}>{incomeDiff >= 0 ? '+' : ''}{incomeDiff.toFixed(1)}%</span>
                  </div>
                  <p className="text-[11px] text-[#9AA6A0] mt-1 font-mono">Media histórica: {formatCurrency(historicalAvgIncome, currencySymbol)}</p>
                </div>
              </div>
            )}
          </div>

          {/* 3-Month Trends */}
          {(detectedTrends.length > 0 || latestExpenseTrend) && (
            <div className="mt-3 rounded-2xl border border-zinc-800 bg-[#1C1F2A] p-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white font-['Plus_Jakarta_Sans']">Tendencias Trimestrales Detectadas</h3>
              </div>
              <div className="mt-3 space-y-2">
                {detectedTrends.map(trend => (
                  <div key={`${trend.id}-${trend.direction}-${trend.months.join('-')}`} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-[#171B26] p-3">
                    <div className={`mt-0.5 rounded-lg p-1.5 ${trend.direction === 'up' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {trend.direction === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">
                        {categoryName(trend.id)} muestra tendencia al {trend.direction === 'up' ? 'alza sostenida' : 'descenso'} durante {trend.months.join(', ')}.
                      </p>
                      <p className="text-[11px] text-[#9AA6A0] mt-0.5 font-mono">
                        Variación: <span className={trend.direction === 'up' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{trend.direction === 'up' ? '+' : '-'}{trend.change.toFixed(1)}%</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patterns and Leakage */}
          <div className="mt-3 rounded-2xl border border-zinc-800 bg-[#1C1F2A] p-5">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-extrabold text-white font-['Plus_Jakarta_Sans']">Patrones de Comportamiento</h3>
            </div>
            <p className="text-xs text-[#9AA6A0] mt-0.5">Identificación de repeticiones y anomalías en la operatoria anual.</p>
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="rounded-xl border border-zinc-800 bg-[#171B26] p-3.5">
                <div className="flex items-center gap-2">
                  <Repeat2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-extrabold text-white">Gastos Recurrentes</span>
                </div>
                {recurringPatterns.length ? (
                  <div className="mt-3 space-y-2">
                    {recurringPatterns.map(g => (
                      <div key={g.key}>
                        <div className="text-xs font-bold text-zinc-300 truncate">{readableTitle(g.key)}</div>
                        <div className="text-[10px] text-[#9AA6A0] font-mono">{g.items.length} veces · media {formatCurrency(g.avg, currencySymbol)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-[#9AA6A0]">Sin repeticiones sistemáticas identificadas.</p>
                )}
              </div>

              <div className="rounded-xl border border-zinc-800 bg-[#171B26] p-3.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-extrabold text-white">Desembolsos Extraordinarios</span>
                </div>
                {extraordinaryCandidates.length ? (
                  <div className="mt-3 space-y-2">
                    {extraordinaryCandidates.map(x => (
                      <div key={x.tx.id}>
                        <div className="text-xs font-bold text-zinc-300 truncate">{x.tx.title}</div>
                        <div className="text-[10px] text-[#9AA6A0] font-mono">{formatCurrency(x.tx.amount, currencySymbol)} · {x.ratio.toFixed(1)}× media del rubro</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-[#9AA6A0]">Sin desembolsos atípicos de alto volumen.</p>
                )}
              </div>

              <div className="rounded-xl border border-zinc-800 bg-[#171B26] p-3.5">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-extrabold text-white">Fugas Micro-Gasto</span>
                </div>
                {smallExpenseGroups.length ? (
                  <div className="mt-3 space-y-2">
                    {smallExpenseGroups.map(g => (
                      <div key={g.key}>
                        <div className="text-xs font-bold text-zinc-300 truncate">{readableTitle(g.key)}</div>
                        <div className="text-[10px] text-[#9AA6A0] font-mono">{g.count} veces · drenaje: {formatCurrency(g.total, currencySymbol)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-[#9AA6A0]">Micro-consumos contenidos.</p>
                )}
              </div>
            </div>
          </div>

          {/* Monthly Evolution Bar */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-[#1C1F2A] p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white font-['Plus_Jakarta_Sans']">Progresión Mensual Comparada</h3>
              </div>
              <div className="space-y-3">
                {monthly.map(m => (
                  <div key={m.key} className="grid grid-cols-[32px_1fr_1fr] items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-[#9AA6A0]">{m.label}</span>
                    <div className="h-2 rounded-full bg-[#262A35] overflow-hidden" title={`Ingresos: ${formatCurrency(m.income, currencySymbol)}`}>
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(m.income / maxMonthlyValue) * 100}%` }} />
                    </div>
                    <div className="h-2 rounded-full bg-[#262A35] overflow-hidden" title={`Egresos: ${formatCurrency(m.expense, currencySymbol)}`}>
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(m.expense / maxMonthlyValue) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-4 text-[10px] font-mono text-[#9AA6A0]">
                <span><i className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />Ingresos</span>
                <span><i className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1.5" />Egresos</span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-[#1C1F2A] p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-extrabold text-white font-['Plus_Jakarta_Sans']">Puntos Críticos de Atención</h3>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-zinc-800 bg-[#171B26] p-3.5">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-[#9AA6A0]">Pico Máximo de Egresos</div>
                  <div className="mt-1 text-sm font-extrabold text-white">{highestExpenseMonth?.label}</div>
                  <div className="text-xs text-rose-400 font-extrabold font-mono mt-0.5">{formatCurrency(highestExpenseMonth?.expense || 0, currencySymbol)}</div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-[#171B26] p-3.5">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-[#9AA6A0]">Pico Máximo de Ingresos</div>
                  <div className="mt-1 text-sm font-extrabold text-white">{highestIncomeMonth?.label}</div>
                  <div className="text-xs text-emerald-400 font-extrabold font-mono mt-0.5">{formatCurrency(highestIncomeMonth?.income || 0, currencySymbol)}</div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-[#171B26] p-3.5">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-[#9AA6A0]">Sectores de Mayor Incidencia Anual</div>
                  <div className="mt-2 space-y-2">
                    {topCategories.length === 0 ? (
                      <span className="text-xs text-[#9AA6A0]">Sin clasificaciones registradas.</span>
                    ) : (
                      topCategories.map(([id, amount], index) => (
                        <div key={id} className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300">#{index + 1} {categoryName(id)}</span>
                          <span className="font-extrabold text-white font-mono">{formatCurrency(amount, currencySymbol)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
