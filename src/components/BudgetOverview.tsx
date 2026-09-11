import React, { useEffect, useState } from 'react';
import { Target, Edit3, ShieldCheck } from 'lucide-react';
import { Category, MonthlyBudget, Transaction } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { GradientIcon } from './GradientIcon';
import { formatCurrency } from '../utils/formatters';

interface BudgetOverviewProps {
  currentMonthKey: string;
  monthlyBudget: MonthlyBudget;
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  onUpdateBudget: (newBudget: MonthlyBudget) => void;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  currentMonthKey,
  monthlyBudget,
  transactions,
  categories,
  currencySymbol,
  onUpdateBudget
}) => {
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [totalInput, setTotalInput] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [catInput, setCatInput] = useState('');

  // Keep edit fields synchronized when the selected month changes.
  useEffect(() => {
    if (!isEditingTotal) setTotalInput(String(monthlyBudget.totalTarget || 0));
    setEditingCategory(null);
    setCatInput('');
  }, [currentMonthKey, monthlyBudget.totalTarget]);

  const expenses = transactions.filter(tx => tx.type === 'expense');

  const categorySpentMap: Record<string, number> = {};
  expenses.forEach(tx => {
    categorySpentMap[tx.categoryId] = (categorySpentMap[tx.categoryId] || 0) + tx.amount;
  });

  const totalSpent = expenses.reduce((sum, tx) => sum + tx.amount, 0);
  const totalTarget = Math.max(0, monthlyBudget.totalTarget || 0);
  const totalPct = totalTarget > 0 ? (totalSpent / totalTarget) * 100 : 0;
  const totalRemaining = totalTarget - totalSpent;

  const parseAmount = (value: string) => {
    const normalized = value.replace(/\s/g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  };

  const handleSaveTotal = () => {
    const val = parseAmount(totalInput);
    if (val !== null) {
      onUpdateBudget({ ...monthlyBudget, monthKey: currentMonthKey, totalTarget: val });
    }
    setIsEditingTotal(false);
  };

  const handleSaveCategoryTarget = (catId: string) => {
    const val = parseAmount(catInput);
    if (val !== null) {
      onUpdateBudget({
        ...monthlyBudget,
        monthKey: currentMonthKey,
        categoryTargets: {
          ...monthlyBudget.categoryTargets,
          [catId]: val
        }
      });
    }
    setEditingCategory(null);
    setCatInput('');
  };

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');

  return (
    <div className="space-y-6 text-zinc-100">
      <div className="bg-zinc-900 border border-zinc-800 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GradientIcon icon={Target} className="w-5 h-5" strokeWidth={2.4} />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Presupuesto mensual · {currentMonthKey}
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Presupuesto Global</h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-md">
              Define cuánto puedes gastar durante el mes y controla automáticamente cuánto llevas consumido.
            </p>
          </div>

          <div className="bg-zinc-950/90 p-4 rounded-2xl border border-zinc-800 min-w-[260px]">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="font-semibold">Límite de gastos</span>
              {!isEditingTotal && (
                <button
                  onClick={() => {
                    setTotalInput(String(totalTarget));
                    setIsEditingTotal(true);
                  }}
                  className="text-orange-400 hover:text-orange-300 flex items-center gap-1 font-bold transition-colors"
                >
                  <GradientIcon icon={Edit3} className="w-3 h-3" strokeWidth={2.2} /> Editar
                </button>
              )}
            </div>

            {isEditingTotal ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={totalInput}
                  onChange={e => setTotalInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveTotal();
                    if (e.key === 'Escape') setIsEditingTotal(false);
                  }}
                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-white font-black text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autoFocus
                />
                <button
                  onClick={handleSaveTotal}
                  className="px-3 py-1 bg-orange-500 text-black font-extrabold text-xs rounded hover:bg-orange-400 transition-colors"
                >OK</button>
              </div>
            ) : (
              <div className="text-2xl font-black text-orange-400">
                {totalTarget > 0 ? formatCurrency(totalTarget, currencySymbol) : 'Sin definir'}
              </div>
            )}

            <div className="mt-3 space-y-2">
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${totalPct >= 100 ? 'bg-rose-500' : totalPct >= 85 ? 'bg-amber-500' : 'bg-orange-500'}`}
                  style={{ width: `${Math.min(totalPct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-300">
                <span>Gastado: <strong className="text-zinc-100">{formatCurrency(totalSpent, currencySymbol)}</strong></span>
                {totalTarget > 0 ? (
                  <strong className={totalRemaining >= 0 ? 'text-orange-400' : 'text-rose-400'}>
                    {totalRemaining >= 0 ? 'Disponible' : 'Excedido'}: {formatCurrency(Math.abs(totalRemaining), currencySymbol)}
                  </strong>
                ) : (
                  <span className="text-zinc-500">Sin límite global</span>
                )}
              </div>
              {totalTarget > 0 && (
                <div className={`text-[11px] font-bold ${totalPct >= 100 ? 'text-rose-400' : totalPct >= 85 ? 'text-amber-400' : 'text-orange-400'}`}>
                  {totalPct.toFixed(0)}% del presupuesto utilizado
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/90 p-6 rounded-2xl border border-zinc-800 shadow-md space-y-4">
        <div>
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <GradientIcon icon={ShieldCheck} className="w-5 h-5" strokeWidth={2.4} />
            Presupuestos por Categoría
          </h3>
          <p className="text-xs text-zinc-400">
            Cada categoría puede tener su propio límite mensual. Las categorías sin límite siguen registrando gastos normalmente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {expenseCategories.map(cat => {
            const spent = categorySpentMap[cat.id] || 0;
            const target = Math.max(0, monthlyBudget.categoryTargets[cat.id] || 0);
            const pct = target > 0 ? (spent / target) * 100 : 0;
            const remaining = target - spent;
            const isEditing = editingCategory === cat.id;

            return (
              <div key={cat.id} className="p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors bg-zinc-950/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center shrink-0">
                      <CategoryIcon name={cat.icon} className="w-4 h-4" strokeWidth={2.4} />
                    </div>
                    <span className="font-extrabold text-zinc-100 text-sm truncate">{cat.name}</span>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => {
                        setCatInput(String(target));
                        setEditingCategory(cat.id);
                      }}
                      className="text-xs font-bold text-zinc-400 hover:text-orange-400 transition-colors p-1"
                      title="Establecer límite"
                    >
                      <GradientIcon icon={Edit3} className="w-3.5 h-3.5" strokeWidth={2.2} />
                    </button>
                  )}
                </div>

                <div className="flex items-baseline justify-between text-xs gap-3">
                  <span className="text-zinc-400">
                    Gastado: <strong className="text-zinc-100">{formatCurrency(spent, currencySymbol)}</strong>
                  </span>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400 font-bold">{currencySymbol}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={catInput}
                        onChange={e => setCatInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveCategoryTarget(cat.id);
                          if (e.key === 'Escape') setEditingCategory(null);
                        }}
                        className="w-20 px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-xs font-bold text-zinc-100 focus:outline-none focus:border-orange-500"
                        autoFocus
                      />
                      <button onClick={() => handleSaveCategoryTarget(cat.id)} className="px-2 py-0.5 bg-orange-500 text-black font-extrabold rounded text-[11px]">OK</button>
                    </div>
                  ) : (
                    <span className="text-zinc-400 font-medium">
                      Límite: <strong className="text-zinc-200">{target > 0 ? formatCurrency(target, currencySymbol) : 'Sin límite'}</strong>
                    </span>
                  )}
                </div>

                {target > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${pct >= 100 ? 'bg-rose-500' : pct >= 85 ? 'bg-amber-500' : 'bg-orange-500'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={pct >= 100 ? 'text-rose-400 font-bold' : pct >= 85 ? 'text-amber-400 font-bold' : 'text-orange-400 font-bold'}>
                        {pct >= 100 ? '🔴 Excedido' : pct >= 85 ? '🟡 Límite cercano' : '🟠 Bajo control'}
                      </span>
                      <span className="font-bold text-zinc-300">
                        {pct.toFixed(0)}% · {remaining >= 0 ? `restan ${formatCurrency(remaining, currencySymbol)}` : `exceso ${formatCurrency(Math.abs(remaining), currencySymbol)}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
