import React, { useMemo } from 'react';
import { AlertTriangle, BellRing, CalendarClock, CheckCircle2, CreditCard, Flame, ShieldAlert, TrendingUp } from 'lucide-react';
import { Category, FinancialCard, FutureCommitment, InstallmentPlan, Subscription, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SmartAlertsProps { currentMonthKey: string; transactions: Transaction[]; categories: Category[]; budgetTarget: number; commitments: FutureCommitment[]; installmentPlans: InstallmentPlan[]; subscriptions: Subscription[]; cards: FinancialCard[]; currencySymbol: string; }
type AlertItem = { id: string; level: 'critical' | 'warning' | 'info' | 'good'; title: string; text: string; icon: React.ElementType };
const dayDiff = (from: string, to: string) => Math.ceil((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000);

export const SmartAlerts: React.FC<SmartAlertsProps> = ({ currentMonthKey, transactions, categories, budgetTarget, commitments, installmentPlans, subscriptions, cards, currencySymbol }) => {
  const todayKey = new Date().toISOString().slice(0, 10);
  const alerts = useMemo<AlertItem[]>(() => {
    const month = transactions.filter(t => t.date.startsWith(currentMonthKey));
    const expenses = month.filter(t => t.type === 'expense');
    const income = month.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const spent = expenses.reduce((s, t) => s + t.amount, 0);
    const result: AlertItem[] = [];
    if (budgetTarget > 0 && spent > budgetTarget) result.push({ id: 'budget-over', level: 'critical', title: 'Presupuesto superado', text: `Llevás ${formatCurrency(spent - budgetTarget, currencySymbol)} por encima del objetivo mensual.`, icon: ShieldAlert });
    else if (budgetTarget > 0) {
      const [y, m] = currentMonthKey.split('-').map(Number); const days = new Date(y, m, 0).getDate(); const current = new Date(); const elapsed = currentMonthKey === todayKey.slice(0, 7) ? Math.min(days, current.getDate()) : days; const projected = elapsed > 0 ? (spent / elapsed) * days : 0;
      if (projected > budgetTarget) result.push({ id: 'pace', level: 'warning', title: 'Ritmo de gasto elevado', text: `Al ritmo actual proyectás cerrar cerca de ${formatCurrency(projected, currencySymbol)}, por encima del presupuesto.`, icon: TrendingUp });
      else result.push({ id: 'budget-ok', level: 'good', title: 'Presupuesto bajo control', text: `Tu ritmo actual proyecta un cierre dentro del objetivo de ${formatCurrency(budgetTarget, currencySymbol)}.`, icon: CheckCircle2 });
    }
    if (income > 0 && spent > income) result.push({ id: 'income-over', level: 'critical', title: 'Gastos superiores a ingresos', text: `En el mes seleccionado gastaste ${formatCurrency(spent - income, currencySymbol)} más de lo ingresado.`, icon: AlertTriangle });
    const byCategory = new Map<string, number>(); expenses.forEach(t => byCategory.set(t.categoryId, (byCategory.get(t.categoryId) || 0) + t.amount)); const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && spent > 0 && top[1] / spent >= 0.4) { const name = categories.find(c => c.id === top[0])?.name || 'una categoría'; result.push({ id: 'concentration', level: 'info', title: 'Gasto concentrado', text: `${name} representa ${(top[1] / spent * 100).toFixed(0)}% de tus gastos del mes.`, icon: Flame }); }
    const dueSoon = [...commitments.filter(c => c.active).map(c => ({ name: c.name, amount: c.amount, date: c.dueDate })), ...subscriptions.filter(s => s.active).map(s => ({ name: s.name, amount: s.amount, date: s.nextChargeDate }))].filter(x => dayDiff(todayKey, x.date) >= 0 && dayDiff(todayKey, x.date) <= 7).sort((a, b) => a.date.localeCompare(b.date));
    if (dueSoon[0]) result.push({ id: 'due-soon', level: 'warning', title: 'Vencimiento próximo', text: `${dueSoon[0].name}: ${formatCurrency(dueSoon[0].amount, currencySymbol)} vence en ${dayDiff(todayKey, dueSoon[0].date)} día(s).`, icon: CalendarClock });
    const cardLimits = cards.filter(c => c.active && c.type === 'credit' && (c.creditLimit || 0) > 0).map(c => { const used = transactions.filter(t => t.type === 'expense' && t.cardId === c.id).reduce((s, t) => s + t.amount, 0); return { c, pct: used / (c.creditLimit || 1) }; }).sort((a, b) => b.pct - a.pct)[0];
    if (cardLimits && cardLimits.pct >= 0.8) result.push({ id: 'card-limit', level: cardLimits.pct >= 1 ? 'critical' : 'warning', title: 'Límite de tarjeta cerca', text: `${cardLimits.c.name} tiene utilizado aproximadamente ${(cardLimits.pct * 100).toFixed(0)}% del límite registrado.`, icon: CreditCard });
    const remainingInstallments = installmentPlans.reduce((s, p) => s + Math.max(0, p.installments - p.currentInstallment + 1), 0);
    if (remainingInstallments > 0) result.push({ id: 'installments', level: 'info', title: 'Cuotas pendientes', text: `Tenés ${remainingInstallments} cuota(s) restantes según tus planes registrados.`, icon: BellRing });
    return result.slice(0, 8);
  }, [currentMonthKey, transactions, categories, budgetTarget, commitments, subscriptions, installmentPlans, cards, currencySymbol, todayKey]);
  const tone = { critical: 'border-rose-500/30 bg-rose-500/10 text-rose-300', warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300', info: 'border-zinc-700 bg-zinc-950/60 text-zinc-300', good: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-300' };
  return <section className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-md"><div className="flex items-center gap-2 mb-1"><BellRing className="w-5 h-5 text-orange-400" /><h2 className="text-lg font-black text-white">Alertas inteligentes</h2><span className="ml-auto text-[9px] uppercase tracking-wider font-bold text-orange-400">Automático</span></div><p className="text-xs text-zinc-500 mb-4">C.R.E.A.M. detecta desvíos y situaciones que merecen tu atención. No realiza ninguna acción por sí sola.</p>{alerts.length ? <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{alerts.map(a => <div key={a.id} className={`rounded-2xl border p-4 ${tone[a.level]}`}><div className="flex gap-3"><a.icon className="w-5 h-5 shrink-0 mt-0.5" /><div><div className="text-sm font-black">{a.title}</div><p className="text-xs mt-1 opacity-90 leading-5">{a.text}</p></div></div></div>)}</div> : <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><div><div className="text-sm font-black text-emerald-300">Sin alertas relevantes</div><p className="text-xs text-zinc-500 mt-1">Por ahora no detecto desvíos importantes con los datos registrados.</p></div></div>}</section>;
};
