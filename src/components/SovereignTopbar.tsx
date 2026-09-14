import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Download, 
  Sun, 
  Moon, 
  Monitor, 
  Calendar,
  Eye,
  EyeOff,
  Menu
} from 'lucide-react';
import { formatCurrency, formatMonthYear, getAdjacentMonthKey, getCurrentMonthKey } from '../utils/formatters';

interface SovereignTopbarProps {
  currentMonthKey: string;
  onMonthChange: (monthKey: string) => void;
  onOpenNewTransaction: () => void;
  onOpenExportImport: () => void;
  onOpenSupabaseSync: () => void;
  currencySymbol: string;
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  netWorthTotal?: number;
  hideValues?: boolean;
  onToggleHideValues?: () => void;
  onOpenMobileMenu?: () => void;
}

export const SovereignTopbar: React.FC<SovereignTopbarProps> = ({
  currentMonthKey,
  onMonthChange,
  onOpenNewTransaction,
  onOpenExportImport,
  onOpenSupabaseSync,
  currencySymbol,
  theme,
  onThemeChange,
  netWorthTotal = 0,
  hideValues = false,
  onToggleHideValues,
  onOpenMobileMenu
}) => {
  const isCurrentMonth = currentMonthKey === getCurrentMonthKey();
  const isCurrentlyLight = theme === 'light' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);

  const handleToggleTheme = () => {
    if (isCurrentlyLight) {
      onThemeChange('dark');
    } else {
      onThemeChange('light');
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[#0F131D]/90 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Left Side: Mobile Menu Button, Month Navigator & Net Worth Quick Indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl text-[#9AA6A0] hover:text-white hover:bg-zinc-800 border border-zinc-800"
              aria-label="Abrir menú"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Month Navigator Pills */}
          <div className="flex items-center bg-[#171B26] border border-zinc-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => onMonthChange(getAdjacentMonthKey(currentMonthKey, -1))}
              className="p-1 sm:p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 text-xs font-bold text-white tracking-wide">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 hidden xs:inline" />
              <span className="capitalize text-[11px] sm:text-xs font-['Plus_Jakarta_Sans']">{formatMonthYear(currentMonthKey)}</span>
            </div>
            <button
              onClick={() => onMonthChange(getAdjacentMonthKey(currentMonthKey, 1))}
              className="p-1 sm:p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>
            {!isCurrentMonth && (
              <button
                onClick={() => onMonthChange(getCurrentMonthKey())}
                className="ml-1 text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all font-mono"
              >
                Hoy
              </button>
            )}
          </div>

          {/* Quick Net Worth Pill (desktop) */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171B26] border border-zinc-800 text-xs">
            <span className="text-[10px] uppercase font-bold text-[#9AA6A0] font-mono">PATRIMONIO NETO</span>
            <span className="font-extrabold text-emerald-400 tracking-tight font-mono">
              {hideValues ? '••••••' : formatCurrency(netWorthTotal, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Privacy Toggle (Hide values) */}
          {onToggleHideValues && (
            <button
              onClick={onToggleHideValues}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-zinc-800 transition-colors"
              title={hideValues ? 'Mostrar importes' : 'Ocultar importes (Modo discreto)'}
            >
              {hideValues ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {/* Theme switcher */}
          <button
            id="theme-toggle-button"
            onClick={handleToggleTheme}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
              isCurrentlyLight
                ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10 border-amber-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80 border-zinc-800'
            }`}
            title={isCurrentlyLight ? 'Modo Día activo (clic para activar Modo Noche)' : 'Modo Noche activo (clic para activar Modo Día)'}
            aria-label="Alternar modo día y noche"
          >
            {isCurrentlyLight ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-zinc-300" />}
            <span className="hidden xl:inline text-[11px] font-semibold">
              {isCurrentlyLight ? 'Día' : 'Noche'}
            </span>
          </button>

          {/* Export / Backup */}
          <button
            onClick={onOpenExportImport}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-zinc-800 transition-colors"
            title="Importar / Exportar datos"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* New Transaction Sovereign Button */}
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-[0_2px_14px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            id="topbar-new-tx-btn"
          >
            <Plus className="w-4 h-4 text-zinc-950" strokeWidth={3} />
            <span className="hidden sm:inline">Nuevo Movimiento</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
