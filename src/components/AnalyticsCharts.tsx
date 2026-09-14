import React from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  CreditCard,
  Flame,
  Activity
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Category, Transaction } from '../types';
import { formatCurrency, PAYMENT_METHOD_LABELS } from '../utils/formatters';

interface AnalyticsChartsProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
}

const FALLBACK_COLORS = [
  '#10B981', '#34D399', '#059669', '#6EE7B7', '#A78BFA',
  '#3B82F6', '#60A5FA', '#93C5FD', '#F59E0B', '#94A3B8'
];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  transactions,
  categories,
  currencySymbol
}) => {
  const expenses = transactions.filter(t => t.type === 'expense');

  // Category Breakdown Data
  const categoryMap: Record<string, number> = {};
  expenses.forEach(tx => {
    categoryMap[tx.categoryId] = (categoryMap[tx.categoryId] || 0) + tx.amount;
  });

  const categoryData = Object.entries(categoryMap).map(([catId, total], index) => {
    const cat = categories.find(c => c.id === catId);
    return {
      name: cat ? cat.name : catId,
      value: total,
      color: cat?.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
    };
  }).sort((a, b) => b.value - a.value);

  const totalExpenseSum = expenses.reduce((sum, tx) => sum + tx.amount, 0);

  // Daily Spending Timeline Data
  const dailyMap: Record<string, number> = {};
  expenses.forEach(tx => {
    const day = tx.date.split('-')[2] || tx.date;
    dailyMap[day] = (dailyMap[day] || 0) + tx.amount;
  });

  const dailyData = Object.entries(dailyMap)
    .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
    .map(([day, total]) => ({
      dia: `Día ${parseInt(day, 10)}`,
      gasto: total
    }));

  // Payment Method Breakdown
  const methodMap: Record<string, number> = {};
  expenses.forEach(tx => {
    methodMap[tx.paymentMethod] = (methodMap[tx.paymentMethod] || 0) + tx.amount;
  });

  const methodData = Object.entries(methodMap).map(([m, val]) => ({
    method: PAYMENT_METHOD_LABELS[m] || m,
    amount: val
  }));

  // Top 3 Expenses
  const topExpenses = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171B26] p-5 sm:p-6 rounded-2xl border border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-400">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]">MÉTRICAS & ANÁLISIS FORENSE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-['Plus_Jakarta_Sans']">
            Distribución & Dinámica de Gasto
          </h2>
          <p className="text-xs text-[#9AA6A0] mt-0.5">
            Comportamiento de consumo, concentración de categorías e intensidad diaria en el mes seleccionado.
          </p>
        </div>

        <div className="text-left sm:text-right bg-[#1C1F2A] border border-zinc-800/80 px-4 py-2.5 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-[#9AA6A0] block">Gasto Total Auditado</span>
          <span className="text-xl sm:text-2xl font-extrabold text-white font-mono">
            {formatCurrency(totalExpenseSum, currencySymbol)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-[#171B26] p-6 rounded-2xl border border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              <span>Participación por Categoría</span>
            </h3>
          </div>

          {categoryData.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#9AA6A0]">
              No hay egresos registrados en el período activo para computar distribución.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#171B26" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val), currencySymbol), 'Egresos']}
                      contentStyle={{ backgroundColor: '#171B26', borderRadius: '12px', border: '1px solid #27272a', color: '#f4f4f5', fontFamily: 'monospace', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-3 border-t border-zinc-800/80">
                {categoryData.map((item) => {
                  const pct = totalExpenseSum > 0 ? (item.value / totalExpenseSum) * 100 : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-[#1C1F2A] border border-zinc-800/80">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold text-zinc-200 truncate">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-white ml-2">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Daily Spending Timeline */}
        <div className="bg-[#171B26] p-6 rounded-2xl border border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Cronología Diaria de Desembolsos</span>
            </h3>
          </div>

          {dailyData.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#9AA6A0]">
              No hay movimientos diarios registrados para proyectar la serie temporal.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262A35" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#9AA6A0' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9AA6A0' }} />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val), currencySymbol), 'Monto']}
                    contentStyle={{ backgroundColor: '#171B26', borderRadius: '12px', border: '1px solid #27272a', color: '#f4f4f5', fontFamily: 'monospace', fontSize: '12px' }}
                  />
                  <Bar dataKey="gasto" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Method Distribution */}
        <div className="bg-[#171B26] p-6 rounded-2xl border border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Vehículos de Pago Utilizados</span>
          </h3>

          {methodData.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9AA6A0]">
              No hay egresos registrados en este ciclo.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {methodData.map((item) => {
                const pct = totalExpenseSum > 0 ? (item.amount / totalExpenseSum) * 100 : 0;
                return (
                  <div key={item.method} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-zinc-300">{item.method}</span>
                      <span className="font-extrabold text-emerald-400 font-mono">
                        {formatCurrency(item.amount, currencySymbol)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#262A35] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top 3 Major Outflows */}
        <div className="bg-[#171B26] p-6 rounded-2xl border border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Transacciones de Mayor Volumen</span>
          </h3>

          {topExpenses.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9AA6A0]">
              No hay egresos registrados en este ciclo.
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {topExpenses.map((tx, idx) => (
                <div key={tx.id} className="p-3.5 bg-[#1C1F2A] rounded-xl flex items-center justify-between border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-xs font-mono flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-xs">{tx.title}</h4>
                      <span className="text-[11px] text-[#9AA6A0] font-mono">{tx.date}</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-white font-mono text-sm">
                    {formatCurrency(tx.amount, currencySymbol)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
