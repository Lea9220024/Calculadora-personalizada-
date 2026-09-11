import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Wallet, 
  Download, 
  PieChart, 
  ListOrdered, 
  Target, 
  LayoutDashboard,
  Settings,
  Calendar,
  Cloud
} from 'lucide-react';
import { GradientIcon } from './GradientIcon';
import { ViewTab } from '../types';
import { formatMonthYear, getAdjacentMonthKey, getCurrentMonthKey } from '../utils/formatters';

interface HeaderProps {
  currentMonthKey: string;
  onMonthChange: (newMonthKey: string) => void;
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onOpenNewTransaction: () => void;
  onOpenExportImport: () => void;
  onOpenSupabaseSync: () => void;
  currencySymbol: string;
  onCurrencyChange: (symbol: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonthKey,
  onMonthChange,
  activeTab,
  onTabChange,
  onOpenNewTransaction,
  onOpenExportImport,
  onOpenSupabaseSync,
  currencySymbol,
  onCurrencyChange
}) => {
  const isCurrentMonth = currentMonthKey === getCurrentMonthKey();

  return (
    <header className="bg-zinc-950 text-zinc-100 border-b border-zinc-800/80 sticky top-0 z-30 shadow-xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
          
          {/* Logo & App Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-md">
                <GradientIcon icon={Wallet} className="w-5 h-5" strokeWidth={2.4} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Mis Gastos Mensuales
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
                    ARS $
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 hidden sm:block">
                  Control financiero personal en Pesos Argentinos
                </p>
              </div>
            </div>

            {/* Mobile actions */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={onOpenSupabaseSync}
                className="flex items-center justify-center w-9 h-9 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors border border-zinc-800"
                title="Nube y respaldo Supabase"
                aria-label="Nube y respaldo Supabase"
                id="mobile-supabase-sync-btn"
              >
                <GradientIcon icon={Cloud} className="w-4 h-4" strokeWidth={2.2} />
              </button>

              <button
                onClick={onOpenNewTransaction}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-md shadow-orange-950/40"
                id="mobile-add-btn"
              >
                <Plus className="w-4 h-4 text-black" strokeWidth={2.5} />
                <span>Nuevo</span>
              </button>
            </div>
          </div>

          {/* Month Selector Navigation */}
          <div className="flex items-center justify-center bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800 shadow-inner">
            <button
              onClick={() => onMonthChange(getAdjacentMonthKey(currentMonthKey, -1))}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
              title="Mes anterior"
              id="prev-month-btn"
            >
              <GradientIcon icon={ChevronLeft} className="w-5 h-5" strokeWidth={2.4} />
            </button>

            <div className="flex items-center gap-2 px-3 py-1 font-bold text-zinc-100 text-sm sm:text-base min-w-[150px] justify-center">
              <GradientIcon icon={Calendar} className="w-4 h-4" strokeWidth={2.2} />
              <span>{formatMonthYear(currentMonthKey)}</span>
            </div>

            <button
              onClick={() => onMonthChange(getAdjacentMonthKey(currentMonthKey, 1))}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
              title="Mes siguiente"
              id="next-month-btn"
            >
              <GradientIcon icon={ChevronRight} className="w-5 h-5" strokeWidth={2.4} />
            </button>

            {!isCurrentMonth && (
              <button
                onClick={() => onMonthChange(getCurrentMonthKey())}
                className="ml-2 text-xs px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 font-bold transition-colors"
                id="current-month-btn"
              >
                Hoy
              </button>
            )}
          </div>

          {/* Action Tools & Desktop Add Button */}
          <div className="hidden md:flex items-center gap-3">
            {/* Currency Badge */}
            <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs">
              <span className="text-zinc-400 font-medium">Moneda:</span>
              <span className="text-orange-400 font-extrabold tracking-wide">
                $ ARS (Peso Argentino)
              </span>
            </div>

            {/* Supabase cloud */}
            <button
              onClick={onOpenSupabaseSync}
              className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors border border-zinc-800"
              title="Nube y respaldo Supabase"
              id="supabase-sync-btn"
            >
              <GradientIcon icon={Cloud} className="w-4 h-4" strokeWidth={2.2} />
            </button>

            {/* Export/Import Backup */}
            <button
              onClick={onOpenExportImport}
              className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors border border-zinc-800"
              title="Respaldos y Datos (CSV / JSON)"
              id="export-import-btn"
            >
              <GradientIcon icon={Download} className="w-4 h-4" strokeWidth={2.2} />
            </button>

            {/* Add Transaction Button */}
            <button
              onClick={onOpenNewTransaction}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-orange-950/40 hover:scale-[1.02] active:scale-[0.98]"
              id="desktop-add-btn"
            >
              <Plus className="w-4 h-4 text-black" strokeWidth={2.8} />
              <span>Nuevo Reg.</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border-t border-zinc-800/80 pt-2 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-zinc-900 text-orange-400 border border-orange-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
            id="tab-dashboard"
          >
            <GradientIcon icon={LayoutDashboard} className="w-4 h-4" strokeWidth={2.2} />
            <span>Resumen General</span>
          </button>

          <button
            onClick={() => onTabChange('transactions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'bg-zinc-900 text-orange-400 border border-orange-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
            id="tab-transactions"
          >
            <GradientIcon icon={ListOrdered} className="w-4 h-4" strokeWidth={2.2} />
            <span>Movimientos</span>
          </button>

          <button
            onClick={() => onTabChange('budgets')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'budgets'
                ? 'bg-zinc-900 text-orange-400 border border-orange-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
            id="tab-budgets"
          >
            <GradientIcon icon={Target} className="w-4 h-4" strokeWidth={2.2} />
            <span>Presupuestos</span>
          </button>

          <button
            onClick={() => onTabChange('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-zinc-900 text-orange-400 border border-orange-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
            id="tab-analytics"
          >
            <GradientIcon icon={PieChart} className="w-4 h-4" strokeWidth={2.2} />
            <span>Estadísticas</span>
          </button>

          <button
            onClick={() => onTabChange('categories')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'categories"
                ? 'bg-zinc-900 text-orange-400 border border-orange-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
            id="tab-categories"
          >
            <GradientIcon icon={Settings} className="w-4 h-4" strokeWidth={2.2} />
            <span>Categorías</span>
          </button>
        </div>
      </div>
    </header>
  );
};
