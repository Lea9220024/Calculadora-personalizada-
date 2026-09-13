import { Category, FutureCommitment, MonthlyBudget, PatrimonyItem, Subscription, Transaction } from '../types';

export type SmartAlertSeverity = 'critical' | 'warning' | 'info' | 'success';
export type SmartAlertType = 'budget' | 'spending' | 'commitment' | 'subscription' | 'patrimony' | 'cashflow';

export interface SmartAlert {
  id: string;
  type: SmartAlertType;
  severity: SmartAlertSeverity;
  title: string;
  message: string;
  amount?: number;
  categoryId?: string;
  createdAt: string;
}

interface SmartAlertInput {
  currentMonthKey: string;
  transactions: Transaction[];
  categories: Category[];
  budget: MonthlyBudget;
  commitments: FutureCommitment[];
  subscriptions: Subscription[];
  patrimonyItems: PatrimonyItem[];
  now?: Date;
}

const daysUntil = (date: string, now: Date) => {
  const target = new Date(`${date}T23:59:59`);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
};

const currency = (amount: number) => amount.toLocaleString('es-AR', { maximumFractionDigits: 0 });

export function generateSmartAlerts({ currentMonthKey, transactions, categories, budget, commitments, subscriptions, patrimonyItems, now = new Date() }: SmartAlertInput): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonthKey));
  const expenses = monthTransactions.filter(t => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  if (budget.totalTarget > 0) {
    const ratio = totalExpenses / budget.totalTarget;
    if (ratio >= 1) {
      alerts.push({ id: 'budget-exceeded', type: 'budget', severity: 'critical', title: 'Presupuesto superado', message: `Ya gastaste ${currency(totalExpenses)}, por encima de tu objetivo mensual de ${currency(budget.totalTarget)}.`, amount: totalExpenses, createdAt: now.toISOString() });
    } else if (ratio >= 0.85) {
      alerts.push({ id: 'budget-warning', type: 'budget', severity: 'warning', title: 'Presupuesto cerca del límite', message: `Llevás utilizado el ${Math.round(ratio * 100)}% del presupuesto mensual.`, amount: totalExpenses, createdAt: now.toISOString() });
    }
  }

  const categorySpend = new Map<string, number>();
  expenses.forEach(t => categorySpend.set(t.categoryId, (categorySpend.get(t.categoryId) || 0) + t.amount));
  Object.entries(budget.categoryTargets || {}).forEach(([categoryId, target]) => {
    if (!target) return;
    const spent = categorySpend.get(categoryId) || 0;
    const ratio = spent / target;
    if (ratio >= 1) {
      const category = categories.find(c => c.id === categoryId);
      alerts.push({ id: `category-over-${categoryId}`, type: 'spending', severity: 'warning', title: `Categoría fuera de presupuesto`, message: `${category?.name || 'Esta categoría'} acumula ${currency(spent)} frente a un límite de ${currency(target)}.`, amount: spent, categoryId, createdAt: now.toISOString() });
    }
  });

  const recentDays = new Set(monthTransactions.filter(t => t.date >= new Date(now.getTime() - 6 * 86400000).toISOString().slice(0, 10)).map(t => t.date));
  const recentExpenses = expenses.filter(t => recentDays.has(t.date)).reduce((sum, t) => sum + t.amount, 0);
  if (recentExpenses > 0 && totalExpenses > 0 && recentExpenses / totalExpenses >= 0.5 && totalExpenses >= 0.25 * Math.max(budget.totalTarget, totalExpenses)) {
    alerts.push({ id: 'recent-spend', type: 'spending', severity: 'info', title: 'Aceleración de gastos', message: `En los últimos días concentrás ${currency(recentExpenses)} de tus gastos del mes.`, amount: recentExpenses, createdAt: now.toISOString() });
  }

  const upcomingCommitments = commitments.filter(c => c.active).map(c => ({ c, days: daysUntil(c.dueDate, now) })).filter(x => x.days >= 0 && x.days <= 7).sort((a, b) => a.days - b.days);
  if (upcomingCommitments.length) {
    const total = upcomingCommitments.reduce((sum, x) => sum + x.c.amount, 0);
    const names = upcomingCommitments.slice(0, 2).map(x => x.c.name).join(' y ');
    alerts.push({ id: 'upcoming-commitments', type: 'commitment', severity: 'warning', title: 'Compromisos próximos', message: `${names} vence${upcomingCommitments.length > 1 ? 'n' : ''} en los próximos 7 días. Total previsto: ${currency(total)}.`, amount: total, createdAt: now.toISOString() });
  }

  const upcomingSubscriptions = subscriptions.filter(s => s.active).map(s => ({ s, days: daysUntil(s.nextChargeDate, now) })).filter(x => x.days >= 0 && x.days <= 7);
  if (upcomingSubscriptions.length) {
    const total = upcomingSubscriptions.reduce((sum, x) => sum + x.s.amount, 0);
    alerts.push({ id: 'upcoming-subscriptions', type: 'subscription', severity: 'info', title: 'Suscripciones por cobrar', message: `${upcomingSubscriptions.length} suscripción${upcomingSubscriptions.length > 1 ? 'es' : ''} se cobrará${upcomingSubscriptions.length > 1 ? 'n' : ''} dentro de 7 días por ${currency(total)}.`, amount: total, createdAt: now.toISOString() });
  }

  if (patrimonyItems.length) {
    const assets = patrimonyItems.filter(i => i.type === 'asset').reduce((sum, i) => sum + i.value, 0);
    const liabilities = patrimonyItems.filter(i => i.type === 'liability').reduce((sum, i) => sum + i.value, 0);
    if (liabilities > assets) {
      alerts.push({ id: 'negative-net-worth', type: 'patrimony', severity: 'critical', title: 'Patrimonio neto negativo', message: `Tus pasivos (${currency(liabilities)}) superan tus activos (${currency(assets)}).`, amount: liabilities - assets, createdAt: now.toISOString() });
    }
  }

  const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  if (income > 0 && totalExpenses > income) {
    alerts.push({ id: 'cashflow-negative', type: 'cashflow', severity: 'critical', title: 'Flujo mensual negativo', message: `Tus gastos del mes superan tus ingresos por ${currency(totalExpenses - income)}.`, amount: totalExpenses - income, createdAt: now.toISOString() });
  }

  return alerts.sort((a, b) => ({ critical: 0, warning: 1, info: 2, success: 3 }[a.severity] - { critical: 0, warning: 1, info: 2, success: 3 }[b.severity])).slice(0, 6);
}
