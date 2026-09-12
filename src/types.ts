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

export type CardType = 'credit' | 'debit';

export interface FinancialCard {
  id: string;
  name: string;
  type: CardType;
  brand?: string;
  last4?: string;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
  active: boolean;
  createdAt: string;
}

export interface InstallmentPlan {
  id: string;
  cardId: string;
  title: string;
  totalAmount: number;
  installmentAmount: number;
  installments: number;
  currentInstallment: number;
  startDate: string;
  transactionId?: string;
  notes?: string;
  createdAt: string;
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
  cardId?: string;
  installmentPlanId?: string;
  installmentNumber?: number;
  installmentTotal?: number;
  installmentTotalAmount?: number;
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

export type ViewTab = 'dashboard' | 'transactions' | 'budgets' | 'analytics' | 'categories' | 'cards';
