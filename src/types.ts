export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 'efectivo' | 'tarjeta_credito' | 'tarjeta_debito' | 'transferencia' | 'otro';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
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

export type SubscriptionFrequency = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: SubscriptionFrequency;
  nextChargeDate: string;
  categoryId?: string;
  paymentMethod: PaymentMethod;
  cardId?: string;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
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
  monthKey: string;
  totalTarget: number;
  categoryTargets: Record<string, number>;
}

export interface AppSettings {
  currencySymbol: string;
  currencyCode: string;
  theme: 'light' | 'dark' | 'system';
  startDayOfMonth: number;
}

export type ViewTab = 'dashboard' | 'transactions' | 'budgets' | 'analytics' | 'categories' | 'cards' | 'subscriptions';
