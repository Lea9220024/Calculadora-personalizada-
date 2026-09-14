import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  ChevronRight, 
  CalendarClock, 
  Bot, 
  ShieldCheck, 
  Sparkles, 
  Receipt,
  Layers,
  ArrowUpRight,
  CreditCard,
  Building2,
  Lock,
  Percent
} from 'lucide-react';
import { 
  Category, 
  FinancialCard, 
  FutureCommitment, 
  InstallmentPlan, 
  MonthlyBudget, 
  NetWorthSnapshot, 
  PatrimonyItem, 
  Subscription, 
  Transaction, 
  ViewTab 
} from '../types';
import { formatCurrency, formatDateSpanish, formatMonthYear } from '../utils/formatters';

interface SovereignDashboardProps {
  currentMonthKey: string;
  transactions: Transaction[];
  categories: Category[];
  budget: MonthlyBudget;
  cards: FinancialCard[];
  commitments: FutureCommitment[];
  subscriptions: Subscription[];
  installmentPlans: InstallmentPlan[];
  patrimonyItems: PatrimonyItem[];
  snapshots: NetWorthSnapshot[];
  currencySymbol: string;
  hideValues?: boolean;
  onNavigateTab: (tab: ViewTab) => void;
  onOpenNewTransaction: () => void;
}

export const SovereignDashboard: React.FC<SovereignDashboardProps> = ({
  currentMonthKey,
  transactions,
  categories,
  budget,
  cards,
  commitments,
  subscriptions,
  installmentPlans,
  patrimonyItems,
  snapshots,
  currencySymbol,
  hideValues = false,
  onNavigateTab,
  onOpenNewTransaction
}) => {
  const [trendView, setTrendView] = useState<'total' | 'liquid' | 'invested'>('total');

  // Month transactions
  const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonthKey));
  const incomeTransactions = monthTransactions.filter(t => t.type === 'income');
  const expenseTransactions = monthTransactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);
  const netSurplus = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Budget calculations
  const budgetTarget = Math.max(0, budget.totalTarget || 0);
  const budgetRemaining = budgetTarget - totalExpenses;
  const budgetPctUsed = budgetTarget > 0 ? (totalExpenses / budgetTarget) * 100 : 0;

  // Days calculations
  const [yearStr, monthStr] = currentMonthKey.split('-');
  const y = Number(yearStr);
  const m = Number(monthStr);
  const totalDaysInMonth = new Date(y, m, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === y && now.getMonth() + 1 === m;
  const currentDay = isCurrentMonth ? now.getDate() : totalDaysInMonth;
  const daysRemaining = Math.max(0, totalDaysInMonth - currentDay);
  const dailySuggestedSpend = daysRemaining > 0 && budgetRemaining > 0 ? budgetRemaining / daysRemaining : 0;

  // Net worth calculations
  const totalAssets = patrimonyItems.filter(i => i.type === 'asset').reduce((acc, i) => acc + i.value, 0);
  const totalLiabilities = patrimonyItems.filter(i => i.type === 'liability').reduce((acc, i) => acc + i.value, 0);
  const netWorth = totalAssets - totalLiabilities;

  // Liquid assets vs invested
  const liquidAssets = patrimonyItems
    .filter(i => i.type === 'asset' && (i.category.toLowerCase().includes('liquid') || i.category.toLowerCase().includes('banco') || i.category.toLowerCase().includes('caja') || i.category.toLowerCase().includes('efectivo')))
    .reduce((acc, i) => acc + i.value, 0);
  const investedAssets = Math.max(0, totalAssets - liquidAssets);

  const displayedNetWorth = trendView === 'liquid' ? liquidAssets : trendView === 'invested' ? investedAssets : netWorth;

  // Emergency Fund months
  const avgMonthlyExpenses = totalExpenses > 0 ? totalExpenses : 1;
  const emergencyFundMonths = liquidAssets > 0 ? liquidAssets / avgMonthlyExpenses : 0;

  // Financial Health Score calculation
  let healthScore = 70;
  if (savingsRate >= 20) healthScore += 12;
  else if (savingsRate > 0) healthScore += 5;
  else healthScore -= 15;

  if (budgetPctUsed <= 90 && budgetTarget > 0) healthScore += 10;
  else if (budgetPctUsed > 100) healthScore -= 10;

  if (emergencyFundMonths >= 3) healthScore += 8;
  healthScore = Math.min(99, Math.max(35, healthScore));

  // Inminent commitments (next 3)
  const todayStr = now.toISOString().slice(0, 10);
  const activeCommitments = [...commitments.filter(c => c.active)].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const nextCommitments = activeCommitments.slice(0, 3);

  // Top spending category
  const expenseByCategory: Record<string, number> = {};
  expenseTransactions.forEach(t => {
    expenseByCategory[t.categoryId] = (expenseByCategory[t.categoryId] || 0) + t.amount;
  });
  const topCategoryEntry = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0];
  const topCategory = topCategoryEntry ? categories.find(c => c.id === topCategoryEntry[0]) : null;

  // Format helper for discreet mode
  const val = (amount: number) => hideValues ? '••••••' : formatCurrency(amount, currencySymbol);

  return (
    <div className="space-y-6">
      {/* Header Banner - Executive Console */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase text-[#9AA6A0]">
            <span className="text-emerald-400">CONSOLE EJECUTIVA</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Auditoría al día · Sync Supabase OK
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
            Portafolio Soberano — Vista Principal
          </h1>
        </div>

        {/* Trend Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#171B26] border border-zinc-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setTrendView('total')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              trendView === 'total' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Total
          </button>
          <button
            onClick={() => setTrendView('liquid')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              trendView === 'liquid' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Líquido
          </button>
          <button
            onClick={() => setTrendView('invested')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              trendView === 'invested' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Invertido
          </button>
        </div>
      </div>

      {/* Top Grid: Main Net Worth Card + Month Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Net Worth Card (7 cols) */}
        <div 
          onClick={() => onNavigateTab('patrimony')}
          className="lg:col-span-7 bg-[#171B26] border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-6 relative overflow-hidden shadow-lg cursor-pointer transition-all group"
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#9AA6A0]">
                Patrimonio Neto Consolidado
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans'] font-mono">
                  {val(displayedNetWorth)}
                </span>
                <span className="text-xs font-semibold text-[#9AA6A0]">ARS</span>
              </div>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+3.97%</span>
            </div>
          </div>

          {/* SVG Trend Chart Visualization */}
          <div className="mt-8 pt-4 relative">
            <div className="h-28 w-full flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sovereignCurveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area */}
                <path
                  d="M 0,85 Q 125,82 250,70 T 420,38 T 500,20 L 500,100 L 0,100 Z"
                  fill="url(#sovereignCurveGrad)"
                />
                {/* Line */}
                <path
                  d="M 0,85 Q 125,82 250,70 T 420,38 T 500,20"
                  fill="none"
                  stroke="#4EDEA3"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Current Dot */}
                <circle cx="500" cy="20" r="5" fill="#4EDEA3" stroke="#171B26" strokeWidth="2" />
              </svg>
            </div>
            {/* Timeline Labels */}
            <div className="flex justify-between text-[11px] font-medium text-[#9AA6A0] pt-2 border-t border-zinc-800/80 mt-1">
              <span>Dic 2024</span>
              <span>Ene 2025</span>
              <span>Feb 2025</span>
              <span>Mar 2025</span>
              <span>Abr 2025</span>
              <span className="text-emerald-400 font-bold">Mayo (Hoy)</span>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* 3 Metric Cards Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3.5 justify-between">
          {/* Income Card */}
          <div 
            onClick={() => onNavigateTab('transactions')}
            className="bg-[#171B26] border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <TrendingDown className="w-5 h-5 rotate-180" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#9AA6A0]">
                  Ingresos Mes ({formatMonthYear(currentMonthKey)})
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-0.5">
                  {val(totalIncome)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% previsto
              </span>
              <div className="text-[10px] text-[#9AA6A0] mt-1 font-medium">{incomeTransactions.length} operaciones</div>
            </div>
          </div>

          {/* Expenses Card */}
          <div 
            onClick={() => onNavigateTab('transactions')}
            className="bg-[#171B26] border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <TrendingUp className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#9AA6A0]">
                  Gastos Mes ({formatMonthYear(currentMonthKey)})
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-0.5">
                  {val(totalExpenses)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                budgetPctUsed > 100 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}>
                {budgetPctUsed.toFixed(0)}% ejecutado
              </span>
              <div className="text-[10px] text-[#9AA6A0] mt-1 font-medium">Límite: {val(budgetTarget)}</div>
            </div>
          </div>

          {/* Surplus Card */}
          <div 
            onClick={() => onNavigateTab('budgets')}
            className="bg-[#171B26] border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Wallet className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#9AA6A0]">
                  Superávit Proyectado
                </div>
                <div className={`text-xl sm:text-2xl font-extrabold font-mono mt-0.5 ${
                  netSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {val(netSurplus)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {savingsRate.toFixed(1)}% ahorro neto
              </span>
              <div className="text-[10px] text-[#9AA6A0] mt-1 font-medium">+6.2% vs target</div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid: Presupuesto Global + Compromisos Inminentes (Left) & Money AI Strategic + Health Score (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (6 cols): Budget Control + Commitments */}
        <div className="lg:col-span-6 space-y-5">
          {/* Global Budget Card */}
          <div className="bg-[#171B26] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-base font-['Plus_Jakarta_Sans']">
                  Control Presupuestario Global
                </h3>
              </div>
              <span className="text-xs font-semibold text-[#9AA6A0]">
                {daysRemaining} días restantes
              </span>
            </div>

            <div className="flex items-baseline justify-between text-xs">
              <span className="text-zinc-400">
                Ejecutado: <strong className="text-white font-mono text-sm">{val(totalExpenses)}</strong>
              </span>
              <span className="text-zinc-400">
                Tope: <strong className="text-zinc-200 font-mono text-sm">{val(budgetTarget)}</strong>
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#262A35] rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  budgetPctUsed > 100 ? 'bg-rose-500' : budgetPctUsed > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(budgetPctUsed, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/80">
              <span className="text-zinc-400">
                Remanente de caja: <strong className="text-emerald-400 font-mono">{val(Math.max(0, budgetRemaining))}</strong>
              </span>
              <span className="text-zinc-400 flex items-center gap-1">
                Gasto sugerido: <strong className="text-emerald-400 font-mono">{val(dailySuggestedSpend)}/día</strong>
              </span>
            </div>
          </div>

          {/* Upcoming Commitments Card */}
          <div className="bg-[#171B26] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="font-extrabold text-white text-base font-['Plus_Jakarta_Sans']">
                  Próximos Compromisos
                </h3>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9AA6A0]">
                {activeCommitments.length} Pasivos Inminentes
              </span>
            </div>

            {nextCommitments.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#9AA6A0]">
                No hay compromisos pendientes registrados.
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {nextCommitments.map(c => (
                  <div 
                    key={c.id} 
                    className="p-3 rounded-xl bg-[#1C1F2A] border border-zinc-800/80 flex items-center justify-between hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                        {c.cardId ? <CreditCard className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{c.name}</div>
                        <div className="text-[10px] text-rose-400 font-semibold mt-0.5">
                          Vence: {c.dueDate}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-white font-mono">{val(c.amount)}</div>
                      <div className="text-[10px] text-[#9AA6A0]">Pago previsto</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (6 cols): Money AI Strategic Insight + Sovereign Health Score */}
        <div className="lg:col-span-6 space-y-5">
          {/* Money AI Strategic Card */}
          <div className="bg-[#1C1F2A] border border-[#A78BFA]/30 rounded-2xl p-5 shadow-lg relative overflow-hidden space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#A78BFA]/20 flex items-center justify-center text-[#A78BFA]">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#A78BFA]">
                  MONEY AI INSIGHT · INTELIGENCIA SOBERANA
                </span>
              </div>
              <span className="text-[10px] text-zinc-400">Auditoría en tiempo real</span>
            </div>

            {/* Strategic 3-Part Structure: QUÉ / POR QUÉ / ACCIÓN */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#171B26]/80 border border-zinc-800/80">
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#A78BFA]">
                  ¿QUÉ DETECTAMOS?
                </div>
                <p className="text-zinc-200 mt-1 leading-relaxed">
                  {topCategory 
                    ? `La categoría ${topCategory.name} absorbió ${val(topCategoryEntry?.[1] || 0)}, concentrando un ritmo atípico en las finanzas del mes.`
                    : 'Gasto corriente balanceado y dentro de la varianza histórica esperada.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#171B26]/80 border border-zinc-800/80">
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#A78BFA]">
                  ¿POR QUÉ SUCEDIÓ?
                </div>
                <p className="text-zinc-300 mt-1 leading-relaxed">
                  {expenseTransactions.length > 5 
                    ? 'Aceleración en consumos programados y pagos con tarjeta acumulados durante la primera quincena.'
                    : 'Volumen moderado de transacciones sin desviaciones críticas de dispersión.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  ACCIÓN RECOMENDADA
                </div>
                <p className="text-zinc-200 mt-1 leading-relaxed">
                  Fijar un tope diario de {val(dailySuggestedSpend)} y activar revisión preventiva de suscripciones para blindar el superávit de fin de mes.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-[#A78BFA]">
                Impacto patrimonial proyectado: Positivo
              </span>
              <button
                onClick={() => onNavigateTab('money-ai')}
                className="px-3 py-1.5 rounded-xl bg-[#A78BFA] hover:bg-[#c4b5fd] text-black text-xs font-extrabold flex items-center gap-1.5 transition-all"
              >
                <span>Revisar en Money AI</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sovereign Financial Health Card */}
          <div className="bg-[#171B26] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-base font-['Plus_Jakarta_Sans']">
                  Salud Financiera Soberana
                </h3>
                <p className="text-xs text-[#9AA6A0]">Índice de solvencia, liquidez y disciplina de capital</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-sm flex items-center gap-1 font-mono">
                <span>{healthScore}</span>
                <span className="text-xs text-zinc-500">/ 100</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#1C1F2A] border border-zinc-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6A0]">
                  TASA DE AHORRO REAL
                </div>
                <div className="text-xl font-extrabold text-white font-mono mt-1">
                  {savingsRate.toFixed(1)}%
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Benchmark objetivo: 25%</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1C1F2A] border border-zinc-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6A0]">
                  FONDO DE EMERGENCIA
                </div>
                <div className="text-xl font-extrabold text-white font-mono mt-1">
                  {emergencyFundMonths.toFixed(1)} <span className="text-xs font-normal text-zinc-400">meses</span>
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Cobertura líquida activa</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Movements Sovereign Table */}
      <div className="bg-[#171B26] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-white text-base font-['Plus_Jakarta_Sans']">
              Últimos Movimientos
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {formatMonthYear(currentMonthKey)}
            </span>
          </div>

          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Ver todos los {monthTransactions.length} movimientos</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Table / List representation */}
        {monthTransactions.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#9AA6A0]">
            No hay transacciones registradas en este período.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800/80 text-[10px] uppercase font-bold tracking-wider text-[#9AA6A0]">
                  <th className="pb-3 font-semibold">Fecha</th>
                  <th className="pb-3 font-semibold">Comercio / Detalle</th>
                  <th className="pb-3 font-semibold">Categoría</th>
                  <th className="pb-3 font-semibold">Medio de Pago</th>
                  <th className="pb-3 font-semibold text-right">Monto</th>
                  <th className="pb-3 font-semibold text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {monthTransactions.slice(0, 5).map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  return (
                    <tr key={tx.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="py-3.5 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3.5 font-bold text-white max-w-[200px] truncate">
                        {tx.title}
                      </td>
                      <td className="py-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 text-[11px] font-medium border border-zinc-700">
                          {cat?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 text-zinc-400 capitalize whitespace-nowrap">
                        {tx.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className={`py-3.5 font-extrabold text-right font-mono text-sm whitespace-nowrap ${
                        tx.type === 'expense' ? 'text-white' : 'text-emerald-400'
                      }`}>
                        {tx.type === 'expense' ? '- ' : '+ '}
                        {val(tx.amount)}
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Conciliado</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
