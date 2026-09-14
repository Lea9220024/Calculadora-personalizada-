import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ListOrdered, 
  Target, 
  PieChart, 
  Bot, 
  Landmark, 
  CalendarClock, 
  CreditCard, 
  BellRing, 
  Settings,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { ViewTab } from '../types';

interface SovereignSidebarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  cloudStatus: 'offline' | 'connected' | 'syncing' | 'error';
  onOpenSupabaseSync: () => void;
  userEmail?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: ViewTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeAi?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Resumen General', icon: LayoutDashboard },
  { id: 'transactions', label: 'Movimientos', icon: ListOrdered },
  { id: 'budgets', label: 'Presupuestos', icon: Target },
  { id: 'analytics', label: 'Estadísticas / Análisis', icon: PieChart },
  { id: 'money-ai', label: 'Money AI', icon: Bot, badgeAi: true },
  { id: 'patrimony', label: 'Patrimonio', icon: Landmark },
  { id: 'commitments', label: 'Compromisos & Deuda', icon: CalendarClock },
  { id: 'cards', label: 'Tarjetas', icon: CreditCard },
  { id: 'subscriptions', label: 'Suscripciones', icon: BellRing },
  { id: 'categories', label: 'Categorías', icon: Settings },
];

export const SovereignSidebar: React.FC<SovereignSidebarProps> = ({
  activeTab,
  onTabChange,
  cloudStatus,
  onOpenSupabaseSync,
  userEmail = 'Sovereign Member',
  isMobileOpen = false,
  onCloseMobile
}) => {
  const syncLabel = cloudStatus === 'connected' 
    ? 'En Línea / Encriptado' 
    : cloudStatus === 'syncing' 
      ? 'Sincronizando...' 
      : cloudStatus === 'error' 
        ? 'Error de conexión' 
        : 'Modo Local / Sin sesión';

  const syncDotColor = cloudStatus === 'connected'
    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(78,222,163,0.6)]'
    : cloudStatus === 'syncing'
      ? 'bg-amber-400 animate-pulse'
      : cloudStatus === 'error'
        ? 'bg-rose-500'
        : 'bg-zinc-500';

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-[#121622] text-[#DFE2F1]">
      {/* Brand Header */}
      <div>
        <div className="px-6 py-6 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-black font-extrabold text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] font-['Plus_Jakarta_Sans']">
              C
            </div>
            <div>
              <div className="font-extrabold text-base tracking-wider text-white flex items-center gap-1.5 font-['Plus_Jakarta_Sans']">
                C.R.E.A.M.
              </div>
              <div className="text-[9px] uppercase font-bold tracking-widest text-[#9AA6A0] font-mono">
                SOVEREIGN INTELLIGENCE
              </div>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#9AA6A0] font-mono">
            Navegación Principal
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-[0_2px_12px_rgba(16,185,129,0.35)]'
                    : 'text-[#DFE2F1] hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-[#9AA6A0] group-hover:text-emerald-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </div>
                {item.badgeAi && (
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-zinc-950' : 'bg-[#A78BFA] shadow-[0_0_6px_rgba(167,139,250,0.8)]'}`} />
                )}
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isActive ? 'bg-black/20 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile & Sync Status */}
      <div className="p-4 border-t border-zinc-800/80 space-y-3">
        <button
          onClick={() => {
            onOpenSupabaseSync();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full text-left p-3 rounded-xl bg-[#171B26] border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between group"
        >
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${syncDotColor}`} />
              <span className="text-[11px] font-bold text-white tracking-tight truncate">
                Supabase Sync
              </span>
            </div>
            <div className="text-[10px] text-[#9AA6A0] truncate mt-0.5 font-medium font-mono">
              {syncLabel}
            </div>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 opacity-70 group-hover:opacity-100" />
        </button>

        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-500 border border-zinc-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{userEmail.split('@')[0]}</div>
              <div className="text-[10px] text-emerald-400 font-medium tracking-tight font-mono">Sovereign Member</div>
            </div>
          </div>
          <button
            onClick={() => {
              onTabChange('categories');
              if (onCloseMobile) onCloseMobile();
            }}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            title="Configuración"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 shrink-0 hidden lg:block border-r border-zinc-800/80 bg-[#121622] text-[#DFE2F1] h-screen sticky top-0 select-none z-30 transition-colors">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
