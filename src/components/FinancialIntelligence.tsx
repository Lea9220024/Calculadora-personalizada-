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

  const expenseByCategory: Record<string, number> = {};
  for (const tx of expenses) {
    expenseByCategory[tx.categoryId] = (expenseByCategory[tx.categoryId] || 0) + tx.amount;
  }

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
    { icon: CalendarClock, label: 'Disponible Diario', value: isCurrentMonth && budgetTarget > 0 && daysRemaining > 0 ? formatCurrency(availablePerDay, currencySymbol) : budgetTarget > 0 ? '—' : 'Definir Presupuesto', detail: isCurrentMonth ? `${daysRemaining} días restantes` : 'Solo mes activo', tone: availablePerDay >= dailySpendRate ? 'text-emerald-400' : 'text-rose-400' },
    { icon: Activity, label: 'Ritmo de Gasto Diario', value: formatCurrency(dailySpendRate, currencySymbol), detail: elapsedDays > 0 ? `${elapsedDays} días transcurridos` : 'Inicio de período', tone: 'text-white' },
    { icon: TrendingUp, label: 'Proyección al Cierre', value: formatCurrency(projectedClose, currencySymbol), detail: budgetTarget > 0 ? projectionOver ? `≈ ${formatCurrency(projectionDelta, currencySymbol)} de desvío` : `≈ ${formatCurrency(Math.abs(projectionDelta), currencySymbol)} de superávit` : 'Sin objetivo de referencia', tone: projectionOver ? 'text-rose-400' : 'text-emerald-400' },
    { icon: Gauge, label: 'Desviación vs Objetivo', value: budgetTarget > 0 ? `${Math.abs(pacePercent).toFixed(0)}% ${pacePercent > 2 ? 'acelerado' : pacePercent < -2 ? 'contenido' : 'en línea'}` : 'Sin referencia', detail: budgetTarget > 0 ? 'Ritmo respecto a la progresión lineal' : 'Definir presupuesto', tone: pacePercent > 2 ? 'text-rose-400' : 'text-emerald-400' }
  ];

  const alert = !budgetTarget || !isCurrentMonth ? null : projectionOver ? { icon: AlertTriangle, title: 'Intensidad de gasto por encima del plan', text: `A este ritmo proyectás sobrepasar tu presupuesto en ${formatCurrency(projectionDelta, currencySymbol)}.`, tone: 'border-rose-500/30 bg-rose-500/10 text-rose-300' } : { icon: CheckCircle2, title: 'Ejecución presupuestaria contenida', text: `A este ritmo proyectás finalizar ${formatCurrency(Math.abs(projectionDelta), currencySymbol)} por debajo del límite fijado.`, tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#171B26] p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-1 mb-5">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-emerald-400" strokeWidth={2.4} />
          <h2 className="text-xl font-extrabold text-white font-['Plus_Jakarta_Sans']">Inteligencia de Flujo & Proyección</h2>
        </div>
        <p className="text-xs text-[#9AA6A0]">Monitoreo forense de velocidad de gasto, alertas de consumo y modelado de fin de mes.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {metricCards.map(({ icon: Icon, label, value, detail, tone }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-[#1C1F2A] p-4 min-h-[118px]">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-[#9AA6A0]">
              <Icon className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.2} />
              {label}
            </div>
            <div className={`mt-2.5 text-xl font-extrabold font-mono tracking-tight ${tone}`}>{value}</div>
            <div className="mt-1 text-[11px] font-mono leading-4 text-[#9AA6A0]">{detail}</div>
          </div>
        ))}
      </div>

      {alert && (
        <div className={`mt-4 rounded-xl border px-4 py-3 flex items-start gap-3 ${alert.tone}`}>
          <alert.icon className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={2.2} />
          <div>
            <div className="text-xs font-extrabold">{alert.title}</div>
            <div className="text-xs mt-0.5 opacity-90">{alert.text}</div>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-extrabold text-white font-['Plus_Jakarta_Sans']">Presupuesto Sugerido & Distribución Óptima</h3>
          <span className="ml-auto text-[9px] uppercase tracking-wider font-extrabold text-emerald-400 border border-emerald-500/25 bg-emerald-500/10 rounded-full px-2 py-0.5 font-mono">ANÁLISIS</span>
        </div>
        <p className="text-xs text-[#9AA6A0] mt-1">Calcula un marco de gasto de máxima eficiencia sin alterar tus presupuestos manuales registrados.</p>
        
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-[#171B26] p-3.5">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#9AA6A0]">Objetivo Sugerido</div>
            <div className="mt-1 text-lg font-extrabold text-emerald-400 font-mono">{smartTarget > 0 ? formatCurrency(smartTarget, currencySymbol) : '—'}</div>
            <div className="text-[10px] text-[#9AA6A0] mt-1">{budgetTarget > 0 ? 'Basado en tu presupuesto actual' : totalIncome > 0 ? '80% de tus ingresos registrados' : 'Requiere ingresos o presupuesto'}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#171B26] p-3.5">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#9AA6A0]">Límite Diario Sugerido</div>
            <div className="mt-1 text-lg font-extrabold text-white font-mono">{smartDailyTarget > 0 ? formatCurrency(smartDailyTarget, currencySymbol) : '—'}</div>
            <div className="text-[10px] text-[#9AA6A0] mt-1">Distribución lineal para 30 días</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#171B26] p-3.5">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#9AA6A0]">Estado Actual</div>
            <div className={`mt-1 text-lg font-extrabold font-mono ${smartStatus === 'excedido' ? 'text-rose-400' : smartStatus === 'controlado' ? 'text-emerald-400' : 'text-zinc-400'}`}>{smartStatus === 'excedido' ? 'Desviado' : smartStatus === 'controlado' ? 'Controlado' : 'Sin datos'}</div>
            <div className="text-[10px] text-[#9AA6A0] mt-1">{smartStatus === 'excedido' ? `Exceso: ${formatCurrency(totalSpent - smartTarget, currencySymbol)}` : smartStatus === 'controlado' ? `Margen: ${formatCurrency(smartTarget - totalSpent, currencySymbol)}` : 'Sin registros suficientes'}</div>
          </div>
        </div>

        {smartTarget > 0 && isCurrentMonth && (
          <div className={`mt-3 rounded-xl border px-3.5 py-2.5 text-xs ${currentDailyGap >= 0 ? 'border-emerald-500/20 bg-emerald-500/5 text-zinc-300' : 'border-rose-500/20 bg-rose-500/5 text-zinc-300'}`}>
            {currentDailyGap >= 0 ? (
              <>Tu ritmo diario actual está <strong className="text-emerald-400 font-mono">{formatCurrency(currentDailyGap, currencySymbol)}</strong> por debajo del techo prudente sugerido.</>
            ) : (
              <>Tu ritmo diario actual excede por <strong className="text-rose-400 font-mono">{formatCurrency(Math.abs(currentDailyGap), currencySymbol)}</strong> el límite recomendado.</>
            )}
          </div>
        )}

        {categoryRecommendations.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#9AA6A0] mb-2">Ponderación Recomendada por Categoría</div>
            <div className="space-y-2">
              {categoryRecommendations.map(item => (
                <div key={item.categoryId} className="rounded-xl border border-zinc-800 bg-[#171B26] p-3">
                  <div className="flex justify-between gap-3 text-xs">
                    <span className="font-bold text-white truncate">{item.name}</span>
                    <span className="font-extrabold text-emerald-400 font-mono">{formatCurrency(item.recommended, currencySymbol)}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-[#9AA6A0] font-mono">
                    Participación: {(item.share * 100).toFixed(0)}% · Consumido {formatCurrency(item.spent, currencySymbol)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isCurrentMonth && budgetTarget > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-[#1C1F2A] px-4 py-3 flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-xs text-[#9AA6A0]">
              {availablePerDay > 0 ? (
                <>Margen de maniobra: <strong className="text-white font-mono">{formatCurrency(availablePerDay, currencySymbol)}</strong>/día para respetar el presupuesto global.</>
              ) : (
                <>Presupuesto total absorbido. Cualquier desembolso adicional genera déficit neto en el ciclo.</>
              )}
            </div>
          </div>
          {topCategory && (
            <div className="rounded-xl border border-zinc-800 bg-[#1C1F2A] px-4 py-3 flex items-start gap-3">
              <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div className="text-xs text-[#9AA6A0]">
                Concentración de egresos: la categoría mayoritaria absorbe el <strong className="text-white font-mono">{topCategoryShare.toFixed(0)}%</strong> del volumen total.
              </div>
            </div>
          )}
        </div>
      )}

      {categoryInsights.length > 0 && (
        <div className="mt-5 pt-5 border-t border-zinc-800/80">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-extrabold text-white font-['Plus_Jakarta_Sans']">Auditoría de Desviaciones</h3>
              <p className="text-xs text-[#9AA6A0]">Comparativa de gasto real contra partidas asignadas por rubro.</p>
            </div>
            {biggestDeviation && <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono">Mayor Desvío</span>}
          </div>
          <div className="space-y-2.5">
            {categoryInsights.slice(0, 5).map(item => {
              const ratio = item.target > 0 ? Math.min(100, item.percentage) : 0;
              const over = item.target > 0 && item.spent > item.target;
              return (
                <div key={item.categoryId} className="rounded-xl border border-zinc-800 bg-[#1C1F2A] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-white truncate">{item.name}</span>
                    <div className="text-right shrink-0">
                      <span className={`text-xs font-extrabold font-mono ${over ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {formatCurrency(item.spent, currencySymbol)}
                      </span>
                      {item.target > 0 && <span className="text-[10px] text-[#9AA6A0] font-mono"> / {formatCurrency(item.target, currencySymbol)}</span>}
                    </div>
                  </div>
                  {item.target > 0 ? (
                    <>
                      <div className="mt-2 h-1.5 rounded-full bg-[#262A35] overflow-hidden">
                        <div className={`h-full rounded-full ${over ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${ratio}%` }} />
                      </div>
                      <div className="mt-1.5 flex justify-between text-[10px] font-mono text-[#9AA6A0]">
                        <span>{item.percentage.toFixed(0)}% del límite</span>
                        <span className={over ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                          {over ? `+${formatCurrency(item.deviation, currencySymbol)}` : `${formatCurrency(Math.max(0, item.target - item.spent), currencySymbol)} libre`}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="mt-1.5 text-[10px] text-[#9AA6A0]">Sin partida fijada para esta categoría.</div>
                  )}
                </div>
              );
            })}
          </div>
          {biggestDeviation ? (
            <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-xs text-zinc-300">
                Principal fuga detectada en <strong className="text-white">{biggestDeviation.name}</strong>: excede por <strong className="text-rose-400 font-mono">{formatCurrency(biggestDeviation.deviation, currencySymbol)}</strong> su meta fijada.
              </span>
            </div>
          ) : bestControlled ? (
            <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-zinc-300">
                Disciplina óptima en <strong className="text-white">{bestControlled.name}</strong>: consumo contenido al <strong className="text-emerald-400 font-mono">{bestControlled.percentage.toFixed(0)}%</strong> de su cuota.
              </span>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
};
