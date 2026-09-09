import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  Copy, 
  Calendar, 
  Tag, 
  CreditCard, 
  Repeat, 
  Receipt,
  ArrowUpDown,
  Plus
} from 'lucide-react';
import { Category, PaymentMethod, Transaction, TransactionType } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { GradientIcon } from './GradientIcon';
import { formatCurrency, formatDateSpanish, PAYMENT_METHOD_LABELS } from '../utils/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol: string;
  onEdit: (tx: Transaction) => void;
  onDuplicate: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  currencySymbol,
  onEdit,
  onDuplicate,
  onDelete,
  onAddNew
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const getCategory = (catId: string) => {
    return categories.find(c => c.id === catId) || {
      id: 'desconocida',
      name: 'Sin Categoría',
      icon: 'Tag',
      color: 'bg-slate-400',
      textColor: 'text-slate-600',
      type: 'expense' as const
    };
  };

  // Filter logic
  const filtered = transactions.filter(tx => {
    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = tx.title.toLowerCase().includes(q);
      const matchNotes = tx.notes?.toLowerCase().includes(q) || false;
      const matchCat = getCategory(tx.categoryId).name.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes && !matchCat) return false;
    }

    // Category
    if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) {
      return false;
    }

    // Method
    if (selectedMethod !== 'all' && tx.paymentMethod !== selectedMethod) {
      return false;
    }

    // Type
    if (selectedType !== 'all' && tx.type !== selectedType) {
      return false;
    }

    return true;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
    if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  // Grouping by Date for date-desc view
  const groupedByDate: Record<string, Transaction[]> = {};
  sorted.forEach(tx => {
    if (!groupedByDate[tx.date]) {
      groupedByDate[tx.date] = [];
    }
    groupedByDate[tx.date].push(tx);
  });

  const totalFilteredAmount = filtered.reduce((acc, tx) => {
    return tx.type === 'expense' ? acc - tx.amount : acc + tx.amount;
  }, 0);

  return (
    <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 shadow-md p-5 space-y-5 text-zinc-100">
      
      {/* Top Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <GradientIcon icon={Receipt} className="w-5 h-5" strokeWidth={2.4} />
            <span>Movimientos del Mes</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {filtered.length} registros
            </span>
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02]"
              id="list-add-new-btn"
            >
              <Plus className="w-4 h-4 text-black" strokeWidth={2.8} />
              <span>Agregar Movimiento</span>
            </button>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Search box */}
          <div className="relative">
            <GradientIcon icon={Search} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2.2} />
            <input
              type="text"
              placeholder="Buscar concepto o nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              id="search-input"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            id="filter-type"
          >
            <option value="all" className="bg-zinc-900">Todos los Tipos</option>
            <option value="expense" className="bg-zinc-900">🟠 Solo Gastos</option>
            <option value="income" className="bg-zinc-900">🟡 Solo Ingresos</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            id="filter-category"
          >
            <option value="all" className="bg-zinc-900">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-zinc-900">
                {c.name}
              </option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            id="filter-method"
          >
            <option value="all" className="bg-zinc-900">Todos los Métodos</option>
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
              <option key={m} value={m} className="bg-zinc-900">
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Summary Pill */}
        {(searchTerm || selectedCategory !== 'all' || selectedMethod !== 'all' || selectedType !== 'all') && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
            <span className="text-zinc-400 font-medium">
              Filtro activo — Balance de selección: {' '}
              <strong className={totalFilteredAmount >= 0 ? 'text-orange-400' : 'text-rose-400'}>
                {formatCurrency(totalFilteredAmount, currencySymbol)}
              </strong>
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedMethod('all');
                setSelectedType('all');
              }}
              className="text-xs text-orange-400 hover:underline font-bold"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Transaction Items */}
      {sorted.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl p-6 bg-zinc-950/40">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-200">No hay movimientos registrados</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            {searchTerm || selectedCategory !== 'all' || selectedMethod !== 'all' || selectedType !== 'all'
              ? 'No encontramos movimientos que coincidan con tus filtros.'
              : 'Empieza a registrar tus gastos e ingresos en pesos argentinos para llevar el control total.'}
          </p>
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-black font-extrabold text-xs rounded-xl shadow-md hover:bg-orange-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Primer Gasto</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([dateStr, items]) => {
            const dayExpenseTotal = items
              .filter(i => i.type === 'expense')
              .reduce((sum, i) => sum + i.amount, 0);
            
            const dayIncomeTotal = items
              .filter(i => i.type === 'income')
              .reduce((sum, i) => sum + i.amount, 0);

            return (
              <div key={dateStr} className="space-y-2">
                {/* Date Header */}
                <div className="flex items-center justify-between px-1 border-b border-zinc-800 pb-1.5">
                  <div className="flex items-center gap-2">
                    <GradientIcon icon={Calendar} className="w-3.5 h-3.5" strokeWidth={2.2} />
                    <span className="text-xs font-bold text-zinc-300">
                      {formatDateSpanish(dateStr)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {dayIncomeTotal > 0 && (
                      <span className="text-amber-400 font-extrabold">
                        +{formatCurrency(dayIncomeTotal, currencySymbol)}
                      </span>
                    )}
                    {dayExpenseTotal > 0 && (
                      <span className="text-orange-400 font-extrabold">
                        -{formatCurrency(dayExpenseTotal, currencySymbol)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date items */}
                <div className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800/80 bg-zinc-950/60 overflow-hidden">
                  {items.map((tx) => {
                    const cat = getCategory(tx.categoryId);
                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 sm:p-4 bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors flex items-center justify-between gap-3 group"
                        id={`tx-item-${tx.id}`}
                      >
                        {/* Icon & Details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <CategoryIcon name={cat.icon} className="w-5 h-5" strokeWidth={2.4} />
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-zinc-100 text-sm truncate">
                                {tx.title}
                              </span>
                              {tx.isRecurring && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
                                  <GradientIcon icon={Repeat} className="w-2.5 h-2.5" strokeWidth={2.2} /> Recurrente
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                              <span className="font-semibold text-zinc-300">
                                {cat.name}
                              </span>
                              <span>•</span>
                              <span>{PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod}</span>
                              {tx.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic text-zinc-500 truncate max-w-[180px]">
                                    "{tx.notes}"
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className={`font-black text-sm sm:text-base ${
                              tx.type === 'expense' ? 'text-orange-400' : 'text-amber-400'
                            }`}>
                              {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount, currencySymbol)}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEdit(tx)}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <GradientIcon icon={Edit2} className="w-3.5 h-3.5" strokeWidth={2.2} />
                            </button>

                            <button
                              onClick={() => onDuplicate(tx)}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                              title="Duplicar"
                            >
                              <GradientIcon icon={Copy} className="w-3.5 h-3.5" strokeWidth={2.2} />
                            </button>

                            <button
                              onClick={() => onDelete(tx.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <GradientIcon icon={Trash2} className="w-3.5 h-3.5" strokeWidth={2.2} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
