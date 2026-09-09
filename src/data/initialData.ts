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
    textColor: 'text-yellow-500',
    type: 'expense'
  },
  {
    id: 'entretenimiento',
    name: 'Ocio y Salidas',
    icon: 'Film',
    color: 'bg-rose-500',
    textColor: 'text-rose-400',
    type: 'expense'
  },
  {
    id: 'salud',
    name: 'Salud y Farmacia',
    icon: 'HeartPulse',
    color: 'bg-red-500',
    textColor: 'text-red-400',
    type: 'expense'
  },
  {
    id: 'suscripciones',
    name: 'Suscripciones y Software',
    icon: 'CreditCard',
    color: 'bg-amber-600',
    textColor: 'text-amber-400',
    type: 'expense'
  },
  {
    id: 'compras',
    name: 'Ropa y Compras',
    icon: 'Tag',
    color: 'bg-rose-600',
    textColor: 'text-rose-500',
    type: 'expense'
  },
  {
    id: 'educacion',
    name: 'Educación y Cursos',
    icon: 'GraduationCap',
    color: 'bg-yellow-600',
    textColor: 'text-yellow-400',
    type: 'expense'
  },
  {
    id: 'otros_gastos',
    name: 'Otros Gastos',
    icon: 'MoreHorizontal',
    color: 'bg-zinc-600',
    textColor: 'text-zinc-400',
    type: 'expense'
  },
  {
    id: 'sueldo',
    name: 'Sueldo / Salario',
    icon: 'Briefcase',
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
    type: 'income'
  },
  {
    id: 'ventas',
    name: 'Ventas / Freelance',
    icon: 'TrendingUp',
    color: 'bg-amber-500',
    textColor: 'text-amber-400',
    type: 'income'
  },
  {
    id: 'otros_ingresos',
    name: 'Otros Ingresos',
    icon: 'DollarSign',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    type: 'income'
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  currencySymbol: '$',
  currencyCode: 'ARS',
  theme: 'dark',
  startDayOfMonth: 1
};

export const getInitialTransactions = (): Transaction[] => {
  const currentMonthKey = '2026-08';
  return [
    {
      id: 'tx-1',
      title: 'Sueldo Mensual',
      amount: 1250000.00,
      type: 'income',
      categoryId: 'sueldo',
      date: `${currentMonthKey}-01`,
      paymentMethod: 'transferencia',
      notes: 'Depósito de nómina en Pesos Argentinos',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-2',
      title: 'Alquiler del Departamento',
      amount: 380000.00,
      type: 'expense',
      categoryId: 'vivienda',
      date: `${currentMonthKey}-02`,
      paymentMethod: 'transferencia',
      isRecurring: true,
      notes: 'Pago mensual alquiler',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-3',
      title: 'Supermercado Semanal',
      amount: 145000.00,
      type: 'expense',
      categoryId: 'comida',
      date: `${currentMonthKey}-03`,
      paymentMethod: 'tarjeta_debito',
      notes: 'Compras de la semana',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-4',
      title: 'Factura de Luz y Agua',
      amount: 38500.00,
      type: 'expense',
      categoryId: 'servicios',
      date: `${currentMonthKey}-04`,
      paymentMethod: 'tarjeta_credito',
      isRecurring: true,
      notes: 'Servicios básicos',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-5',
      title: 'Cena con Amigos',
      amount: 28000.00,
      type: 'expense',
      categoryId: 'entretenimiento',
      date: `${currentMonthKey}-05`,
      paymentMethod: 'efectivo',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-6',
      title: 'Suscripción Netflix & Spotify',
      amount: 12500.00,
      type: 'expense',
      categoryId: 'suscripciones',
      date: `${currentMonthKey}-06`,
      paymentMethod: 'tarjeta_credito',
      isRecurring: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-7',
      title: 'Carga de Combustible (Nafta)',
      amount: 35000.00,
      type: 'expense',
      categoryId: 'transporte',
      date: `${currentMonthKey}-07`,
      paymentMethod: 'tarjeta_debito',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx-8',
      title: 'Trabajo Freelance Diseño',
      amount: 280000.00,
      type: 'income',
      categoryId: 'ventas',
      date: `${currentMonthKey}-08`,
      paymentMethod: 'transferencia',
      notes: 'Proyecto logotipo cliente',
      createdAt: new Date().toISOString()
    }
  ];
};

export const getInitialBudgets = (): MonthlyBudget[] => {
  return [
    {
      monthKey: '2026-08',
      totalTarget: 850000,
      categoryTargets: {
        vivienda: 400000,
        comida: 220000,
        servicios: 60000,
        transporte: 70000,
        entretenimiento: 50000,
        suscripciones: 20000,
        salud: 30000
      }
    }
  ];
};
