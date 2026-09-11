import React from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  CreditCard,
  TrendingDown,
  Flame,
  Sparkles
} from 'lucide-react';
import { GradientIcon } from './GradientIcon';
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
  '#f97316', '#f59e0b', '#eab308', '#fb923c', '#f43f5e',
  '#d97706', '#b45309', '#e11d48', '#ca8a04', '#a1a1aa'
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
    <div className="space-y-6 text-zinc-100">
      <div className="flex items-center justify-between bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-md">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <GradientIcon icon={Sparkles} className="w-5 h-5" strokeWidth={2.4} />
            <span>Análisis Visual e Insights</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Distribución de gastos, hábitos diarios y comportamiento de consumo.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-zinc-400 block">Total Gastado</span>
          <span className="text-xl font-black text-orange-400">
            {formatCurrency(totalExpenseSum, currencySymbol)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/90 p-6 rounded-2xl border border-zinc-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <GradientIcon icon={PieIcon} className="w-4 h-4" strokeWidth={2.2} />
              <span>Gastos por Categoría</span>
            </h3>
          </div>

          {categoryData.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No hay gastos registrados este mes para graficar.
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
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val), currencySymbol), 'Gasto']}
                      contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', color: '#f4f4f5' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-800">
                {categoryData.map((item) => {
                  const pct = totalExpenseSum > 0 ? (item.value / totalExpenseSum) * 100 : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold text-zinc-300 truncate">{item.name}</span>
                      </div>
                      <span className="font-extrabold text-zinc-100 ml-2">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-zinc-900/90 p-6 rounded-2xl border border-zinc-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <GradientIcon icon={BarChart3} className="w-4 h-4" strokeWidth={2.2} />
              <span>Gasto Diario en el Mes</span>
            </h3>
          </div>

          {dailyData.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No hay datos suficientes para la línea de tiempo.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val), currencySymbol), 'Monto']}
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', color: '#f4f4f5' }}
                  />
                  <Bar dataKey="gasto" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/90 p-6 rounded-2xl border border-zinc-800 shadow-md space-y-3">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <GradientIcon icon={CreditCard} className="w-4 h-4" strokeWidth={2.2} />
            <span>Distribución por Método de Pago</span>
          </h3>

          {methodData.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No hay gastos registrados este mes.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {methodData.map((item) => {
                const pct = totalExpenseSum > 0 ? (item.amount / totalExpenseSum) * 100 : 0;
                return (
                  <div key={item.method} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-zinc-300">{item.method}</span>
                      <span className="font-extrabold text-orange-400">
                        {formatCurrency(item.amount, currencySymbol)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-zinc-900/90 p-6 rounded-2xl border border-zinc-800 shadow-md space-y-3">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <GradientIcon icon={Flame} className="w-4 h-4" strokeWidth={2.2} />
            <span>Mayor Impacto en el Mes</span>
          </h3>

          {topExpenses.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No hay gastos registrados este mes.
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {topExpenses.map((tx, idx) => (
                <div key={tx.id} className="p-3 bg-zinc-950/80 rounded-xl flex items-center justify-between border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-zinc-100 text-xs">{tx.title}</h4>
                      <span className="text-[11px] text-zinc-500">{tx.date}</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-orange-400 text-sm">
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
