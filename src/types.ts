export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 'efectivo' | 'tarjeta_credito' | 'tarjeta_debito' | 'transferencia' | 'otro';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string; // Tailwind bg color or hex
  textColor: string;
  type: TransactionType | 'both';
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  isRecurring?: boolean;
  createdAt: string;
}

export interface MonthlyBudget {
  monthKey: string; // YYYY-MM
  totalTarget: number;
  categoryTargets: Record<string, number>; // categoryId -> targetAmount
}

export interface AppSettings {
  currencySymbol: string;
  currencyCode: string;
  theme: 'light' | 'dark' | 'system';
  startDayOfMonth: number; // e.g., 1
}

export type ViewTab = 'dashboard' | 'transactions' | 'budgets' | 'analytics' | 'categories';
