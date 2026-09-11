import { Category, Transaction, MonthlyBudget, AppSettings } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'vivienda',
    name: 'Vivienda y Alquiler',
    icon: 'Home',
    color: 'bg-orange-600',
    textColor: 'text-orange-500',
    type: 'expense'
  },
  {
    id: 'comida',
    name: 'Alimentación y Supermercado',
    icon: 'ShoppingBag',
    color: 'bg-amber-500',
    textColor: 'text-amber-500',
    type: 'expense'
  },
  {
    id: 'transporte',
    name: 'Transporte y Combustible',
    icon: 'Car',
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
    type: 'expense'
  },
  {
    id: 'servicios',
    name: 'Servicios (Luz, Agua, Internet)',
    icon: 'Zap',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    type: 'expense'
  },
  {
    id: 'salud',
    name: 'Salud',
    icon: 'HeartPulse',
    color: 'bg-red-500',
    textColor: 'text-red-400',
    type: 'expense'
  },
  {
    id: 'suscripciones',
    name: 'Suscripciones',
    icon: 'PlayCircle',
    color: 'bg-violet-500',
    textColor: 'text-violet-400',
    type: 'expense'
  },
  {
    id: 'entretenimiento',
    name: 'Entretenimiento',
    icon: 'Gamepad2',
    color: 'bg-fuchsia-500',
    textColor: 'text-fuchsia-400',
    type: 'expense'
  },
  {
    id: 'compras',
    name: 'Compras',
    icon: 'ShoppingCart',
    color: 'bg-pink-500',
    textColor: 'text-pink-400',
    type: 'expense'
  },
  {
    id: 'educacion',
    name: 'Educación',
    icon: 'BookOpen',
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    type: 'expense'
  },
  {
    id: 'otros',
    name: 'Otros gastos',
    icon: 'MoreHorizontal',
    color: 'bg-zinc-500',
    textColor: 'text-zinc-400',
    type: 'expense'
  },
  {
    id: 'sueldo',
    name: 'Sueldo',
    icon: 'Banknote',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    type: 'income'
  },
  {
    id: 'otros_ingresos',
    name: 'Otros ingresos',
    icon: 'CircleDollarSign',
    color: 'bg-green-500',
    textColor: 'text-green-400',
    type: 'income'
  }
];

// La aplicación comienza vacía: las categorías se mantienen, pero no se
// cargan movimientos ni presupuestos ficticios. Los datos reales se crean
// desde la interacción del usuario.
export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGET: MonthlyBudget = {
  monthKey: '',
  totalTarget: 0,
  categoryTargets: {}
};

export const DEFAULT_SETTINGS: AppSettings = {
  currencySymbol: '$',
  currencyCode: 'ARS',
  theme: 'dark',
  startDayOfMonth: 1
};
