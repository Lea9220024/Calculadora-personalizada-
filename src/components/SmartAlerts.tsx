import React, { useMemo } from 'react';
import { AlertTriangle, BellRing, CalendarClock, CheckCircle2, CreditCard, Flame, ShieldAlert, TrendingUp } from 'lucide-react';
import { Category, FinancialCard, FutureCommitment, InstallmentPlan, Subscription, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SmartAlertsProps {
  currentMonthKey: string;
  transactions: Transaction[];
  categories: Category[];
  budgetTarget: number;
  commitments: FutureCommitment[];
  installmentPlans: InstallmentPlan[];
  subscriptions: Subscription[];
  cards: FinancialCard[];
  currencySymbol: string;
}

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

    if (budgetTarget > 0 && spent > budgetTarget) {
      result.push({ id: 'budget-over', level: 'critical', title: 'Techo Presupuestario Excedido', text: `Registrás ${formatCurrency(spent - budgetTarget, currencySymbol)} por encima del objetivo mensual fijado.`, icon: ShieldAlert });
    } else if (budgetTarget > 0) {
      const [y, m] = currentMonthKey.split('-').map(Number);
      const days = new Date(y, m, 0).getDate();
      const current = new Date();
      const elapsed = currentMonthKey === todayKey.slice(0, 7) ? Math.min(days, current.getDate()) : days;
      const projected = elapsed > 0 ? (spent / elapsed) * days : 0;
      if (projected > budgetTarget) {
        result.push({ id: 'pace', level: 'warning', title: 'Velocidad de Gasto Acelerada', text: `Al ritmo actual proyectás cerrar cerca de ${formatCurrency(projected, currencySymbol)}, excediendo el presupuesto.`, icon: TrendingUp });
      } else {
        result.push({ id: 'budget-ok', level: 'good', title: 'Disciplina de Gasto Consistente', text: `Tu ritmo de desembolsos proyecta un cierre ordenado dentro de los ${formatCurrency(budgetTarget, currencySymbol)}.`, icon: CheckCircle2 });
      }
    }

    if (income > 0 && spent > income) {
      result.push({ id: 'income-over', level: 'critical', title: 'Flujo Operativo Deficitario', text: `En este ciclo los desembolsos superan a los ingresos en ${formatCurrency(spent - income, currencySymbol)}.`, icon: AlertTriangle });
    }

    const byCategory = new Map<string, number>();
    expenses.forEach(t => byCategory.set(t.categoryId, (byCategory.get(t.categoryId) || 0) + t.amount));
    const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && spent > 0 && top[1] / spent >= 0.4) {
      const name = categories.find(c => c.id === top[0])?.name || 'una categoría';
      result.push({ id: 'concentration', level: 'info', title: 'Alta Concentración Sectorial', text: `${name} representa el ${(top[1] / spent * 100).toFixed(0)}% del total de tus egresos del ciclo.`, icon: Flame });
    }

    const dueSoon = [
      ...commitments.filter(c => c.active).map(c => ({ name: c.name, amount: c.amount, date: c.dueDate })),
      ...subscriptions.filter(s => s.active).map(s => ({ name: s.name, amount: s.amount, date: s.nextChargeDate }))
    ].filter(x => dayDiff(todayKey, x.date) >= 0 && dayDiff(todayKey, x.date) <= 7).sort((a, b) => a.date.localeCompare(b.date));

    if (dueSoon[0]) {
      result.push({ id: 'due-soon', level: 'warning', title: 'Compromiso Inminente', text: `${dueSoon[0].name}: ${formatCurrency(dueSoon[0].amount, currencySymbol)} vence en ${dayDiff(todayKey, dueSoon[0].date)} día(s).`, icon: CalendarClock });
    }

    const cardLimits = cards.filter(c => c.active && c.type === 'credit' && (c.creditLimit || 0) > 0).map(c => {
      const used = transactions.filter(t => t.type === 'expense' && t.cardId === c.id).reduce((s, t) => s + t.amount, 0);
      return { c, pct: used / (c.creditLimit || 1) };
    }).sort((a, b) => b.pct - a.pct)[0];

    if (cardLimits && cardLimits.pct >= 0.8) {
      result.push({ id: 'card-limit', level: cardLimits.pct >= 1 ? 'critical' : 'warning', title: 'Línea de Crédito Tensionada', text: `${cardLimits.c.name} tiene consumido aproximadamente el ${(cardLimits.pct * 100).toFixed(0)}% de su margen crediticio.`, icon: CreditCard });
    }

    const remainingInstallments = installmentPlans.reduce((s, p) => s + Math.max(0, p.installments - p.currentInstallment + 1), 0);
    if (remainingInstallments > 0) {
      result.push({ id: 'installments', level: 'info', title: 'Carga de Cuotas Activa', text: `Tenés ${remainingInstallments} cuota(s) calendarizadas pendientes de cancelación.`, icon: BellRing });
    }

    return result.slice(0, 8);
  }, [currentMonthKey, transactions, categories, budgetTarget, commitments, subscriptions, installmentPlans, cards, currencySymbol, todayKey]);

  const tone = {
    critical: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    info: 'border-zinc-800 bg-[#1C1F2A] text-zinc-300',
    good: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-300'
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#171B26] p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <BellRing className="w-5 h-5 text-emerald-400" />
        <h2 className="text-xl font-extrabold text-white font-['Plus_Jakarta_Sans']">Señales de Alerta & Monitoreo</h2>
        <span className="ml-auto text-[9px] uppercase tracking-wider font-extrabold text-emerald-400 border border-emerald-500/25 bg-emerald-500/10 rounded-full px-2 py-0.5 font-mono">AUTOMÁTICO</span>
      </div>
      <p className="text-xs text-[#9AA6A0] mb-4">Detección heurística de riesgos de liquidez, desvíos presupuestarios y tensión crediticia.</p>

      {alerts.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.map(a => (
            <div key={a.id} className={`rounded-xl border p-4 ${tone[a.level]}`}>
              <div className="flex gap-3">
                <a.icon className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-extrabold">{a.title}</div>
                  <p className="text-xs mt-1 opacity-90 leading-5">{a.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-sm font-extrabold text-emerald-300">Posición Financiera Estable</div>
            <p className="text-xs text-[#9AA6A0] mt-0.5">No se detectan desvíos críticos ni anomalías de liquidez en el período auditado.</p>
          </div>
        </div>
      )}
    </section>
  );
};
