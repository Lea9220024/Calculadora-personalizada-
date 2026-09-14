import React, { useMemo, useState } from 'react';
import { Bot, Send, Sparkles, ShieldCheck, TrendingDown, Wallet, CalendarClock, Target } from 'lucide-react';
import { Category, FinancialCard, FutureCommitment, InstallmentPlan, MonthlyBudget, PatrimonyItem, Subscription, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface MoneyAIProps {
  currentMonthKey: string;
  transactions: Transaction[];
  categories: Category[];
  budget: MonthlyBudget;
  commitments: FutureCommitment[];
  installmentPlans: InstallmentPlan[];
  subscriptions: Subscription[];
  patrimonyItems: PatrimonyItem[];
  cards: FinancialCard[];
  currencySymbol: string;
}

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const money = (value: number, symbol: string) => formatCurrency(Math.max(0, value), symbol);

export const MoneyAI: React.FC<MoneyAIProps> = ({ currentMonthKey, transactions, categories, budget, commitments, installmentPlans, subscriptions, patrimonyItems, cards, currencySymbol }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);

  const monthTransactions = useMemo(() => transactions.filter(t => t.date.startsWith(currentMonthKey)), [transactions, currentMonthKey]);
  const monthExpenses = monthTransactions.filter(t => t.type === 'expense');
  const monthIncome = monthTransactions.filter(t => t.type === 'income');
  const totalSpent = monthExpenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = monthIncome.reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalSpent;

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    monthExpenses.forEach(t => { totals[t.categoryId] = (totals[t.categoryId] || 0) + t.amount; });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([id, amount]) => ({ id, amount, name: categories.find(c => c.id === id)?.name || 'Sin categoría' }));
  }, [monthExpenses, categories]);

  const recurringMonthly = useMemo(() => {
    const tx = transactions.filter(t => t.type === 'expense' && t.isRecurring);
    const byTitle = new Map<string, number>();
    tx.forEach(t => byTitle.set(normalize(t.title), Math.max(byTitle.get(normalize(t.title)) || 0, t.amount)));
    return Array.from(byTitle.values()).reduce((s, v) => s + v, 0);
  }, [transactions]);

  const projected90 = useMemo(() => {
    const today = new Date();
    const end = new Date(today); end.setDate(end.getDate() + 90);
    const manual = commitments.filter(c => c.active && c.dueDate >= today.toISOString().slice(0, 10) && c.dueDate <= end.toISOString().slice(0, 10)).reduce((s, c) => s + c.amount, 0);
    const subs = subscriptions.filter(s => s.active).reduce((sum, s) => {
      const amount = s.frequency === 'monthly' ? s.amount * 3 : s.amount;
      return sum + amount;
    }, 0);
    const installments = installmentPlans.reduce((s, p) => s + p.installmentAmount * Math.min(3, Math.max(0, p.installments - p.currentInstallment + 1)), 0);
    return manual + subs + installments;
  }, [commitments, subscriptions, installmentPlans]);

  const patrimony = patrimonyItems.reduce((s, item) => s + (item.type === 'asset' ? item.value : -item.value), 0);

  const answer = (raw: string) => {
    const q = normalize(raw);
    const top = categoryTotals[0];
    const remainingBudget = budget.totalTarget - totalSpent;

    if (q.includes('en que') && (q.includes('fue') || q.includes('gasto') || q.includes('plata'))) {
      if (!top) return 'Todavía no tengo gastos registrados en el mes seleccionado para analizar.';
      const list = categoryTotals.slice(0, 5).map((c, i) => `${i + 1}. ${c.name}: ${money(c.amount, currencySymbol)}`).join(' · ');
      return `Este mes llevás ${money(totalSpent, currencySymbol)} de gastos. La categoría principal es ${top.name} con ${money(top.amount, currencySymbol)}. Ranking: ${list}.`;
    }

    if (q.includes('cuanto') && (q.includes('puedo gastar') || q.includes('gastar'))) {
      if (!budget.totalTarget) return `No hay un presupuesto mensual definido. Llevás ${money(totalSpent, currencySymbol)} de gastos y ${money(totalIncome, currencySymbol)} de ingresos registrados.`;
      return remainingBudget >= 0 ? `Te quedan ${money(remainingBudget, currencySymbol)} antes de alcanzar tu presupuesto mensual de ${money(budget.totalTarget, currencySymbol)}.` : `Ya superaste el presupuesto en ${money(Math.abs(remainingBudget), currencySymbol)}. Mi recomendación es frenar gastos no esenciales hasta recuperar margen.`;
    }

    if (q.includes('reduc') || q.includes('ajust') || q.includes('ahorr')) {
      const suggestions = categoryTotals.slice(0, 3).map(c => `${c.name} (${money(c.amount, currencySymbol)})`).join(', ');
      return top ? `Empezaría por ${suggestions}. No significa eliminar esos gastos: priorizaría el mayor importe y buscaría una reducción concreta del 10–20% antes de tocar gastos esenciales.` : 'Necesito más gastos registrados para detectar dónde ajustar.';
    }

    if (q.includes('90') || q.includes('compromet')) return `Para los próximos 90 días detecto aproximadamente ${money(projected90, currencySymbol)} comprometidos/proyectados entre cuotas, suscripciones y compromisos manuales. Es una proyección orientativa, no genera movimientos.`;

    if (q.includes('compar') || q.includes('mes anterior') || q.includes('histor')) {
      const months = Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))).sort();
      const previous = months.filter(m => m < currentMonthKey).at(-1);
      if (!previous) return 'Todavía no tengo un mes anterior disponible para hacer una comparación confiable.';
      const prevSpent = transactions.filter(t => t.type === 'expense' && t.date.startsWith(previous)).reduce((s, t) => s + t.amount, 0);
      const diff = totalSpent - prevSpent;
      return `Contra ${previous}, este mes llevás ${money(Math.abs(diff), currencySymbol)} ${diff >= 0 ? 'más' : 'menos'} gasto (${money(totalSpent, currencySymbol)} vs. ${money(prevSpent, currencySymbol)}).`;
    }

    if (q.includes('puedo') && (q.includes('comprar') || q.includes('permitir'))) {
      const match = raw.replace(/\./g, '').match(/\$?\s*([0-9]+(?:[.,][0-9]+)?)/);
      const amount = match ? Number(match[1].replace(/\./g, '').replace(',', '.')) : 0;
      if (!amount) return `Puedo evaluarlo si me decís el importe, por ejemplo: “¿Puedo permitirme comprar algo de $200.000?”`;
      const safe = amount <= Math.max(0, balance) && (!budget.totalTarget || totalSpent + amount <= budget.totalTarget);
      return safe ? `Con los datos actuales, ${money(amount, currencySymbol)} entra dentro de tu margen disponible. Aun así, dejaría un colchón y revisaría tus compromisos futuros antes de comprar.` : `No consideraría ${money(amount, currencySymbol)} una compra cómoda hoy: reduciría tu margen disponible o te llevaría por encima del presupuesto. La decisión final depende de tus gastos próximos.`;
    }

    if (q.includes('patrimonio') || q.includes('neto') || q.includes('activos')) return `Tu patrimonio neto registrado es de ${money(patrimony, currencySymbol)}. Esto depende únicamente de los activos y pasivos que hayas cargado en C.R.E.A.M.`;
    if (q.includes('tarjeta') || q.includes('cuota')) return `Tenés ${cards.filter(c => c.active).length} tarjetas activas y ${installmentPlans.length} planes de cuotas registrados. Las cuotas forman parte de tu carga futura; revisalas antes de asumir nuevos compromisos.`;
    if (q.includes('suscrip')) return `Tenés ${subscriptions.filter(s => s.active).length} suscripciones activas, con un costo recurrente mensual estimado de ${money(subscriptions.filter(s => s.active).reduce((s, x) => s + (x.frequency === 'monthly' ? x.amount : x.amount / 12), 0), currencySymbol)}.`;
    if (q.includes('resumen') || q.includes('como estoy') || q.includes('estado')) return `Resumen: ingresos ${money(totalIncome, currencySymbol)}, gastos ${money(totalSpent, currencySymbol)}, saldo ${balance >= 0 ? '' : '-'}${money(Math.abs(balance), currencySymbol)}. Presupuesto: ${budget.totalTarget ? money(budget.totalTarget, currencySymbol) : 'sin definir'}. Compromisos 90 días: ${money(projected90, currencySymbol)}.`;

    return `Puedo ayudarte a analizar tus datos de C.R.E.A.M. Probá con: “¿En qué se me fue la plata?”, “¿Cuánto puedo gastar?”, “¿Qué debería reducir?”, “¿Cuánto tengo comprometido en 90 días?”, “¿Puedo comprar algo de $200.000?” o “¿Cómo estoy este mes?”.`;
  };

  const ask = (text = question) => {
    const clean = text.trim();
    if (!clean) return;
    setMessages(prev => [...prev, { role: 'user', text: clean }, { role: 'ai', text: answer(clean) }]);
    setQuestion('');
  };

  const quick = [
    { icon: Wallet, label: '¿En qué se me fue la plata?' },
    { icon: Target, label: '¿Cuánto puedo gastar?' },
    { icon: TrendingDown, label: '¿Qué debería reducir?' },
    { icon: CalendarClock, label: '¿Cuánto tengo comprometido en 90 días?' }
  ];

  return <section className="rounded-2xl border border-zinc-800 bg-[#171B26] p-5 sm:p-6 shadow-sm">
    <div className="flex items-start gap-3.5 mb-5">
      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
        <Bot className="w-5 h-5 text-purple-400" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold text-white font-['Plus_Jakarta_Sans']">Copiloto Money AI</h2>
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-purple-400 border border-purple-500/25 bg-purple-500/10 rounded-full px-2 py-0.5 font-mono">SOVEREIGN AI</span>
        </div>
        <p className="text-xs text-[#9AA6A0] mt-1">Análisis predictivo de liquidez, carga de compromisos y auditoría instantánea de solvencia basada en tus registros.</p>
      </div>
    </div>

    <div className="flex flex-wrap gap-2 mb-4">
      {quick.map(item => (
        <button key={item.label} onClick={() => ask(item.label)} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-800 bg-[#1C1F2A] hover:border-purple-500/40 hover:text-purple-300 text-xs font-semibold text-zinc-300 transition-colors">
          <item.icon className="w-3.5 h-3.5 text-purple-400" />
          {item.label}
        </button>
      ))}
    </div>

    <div className="min-h-[260px] max-h-[420px] overflow-y-auto rounded-2xl border border-zinc-800 bg-[#0F131D] p-4 space-y-3">
      {messages.length === 0 ? (
        <div className="h-[250px] flex flex-col items-center justify-center text-center px-6">
          <Sparkles className="w-8 h-8 text-purple-400/80 mb-3" />
          <p className="text-sm font-bold text-white">Consultá cualquier inquietud sobre tu estructura financiera.</p>
          <p className="text-xs text-[#9AA6A0] mt-1 max-w-md">Evaluaciones calculadas con tus transacciones, presupuestos, límites de tarjetas, cuotas, suscripciones y patrimonio neto.</p>
        </div>
      ) : (
        messages.map((m, i) => (
          <div key={`${i}-${m.role}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-5 font-medium ${m.role === 'user' ? 'bg-emerald-500 text-black font-bold' : 'bg-[#1C1F2A] border border-zinc-800 text-zinc-200'}`}>
              {m.text}
            </div>
          </div>
        ))
      )}
    </div>

    <div className="mt-3 flex gap-2">
      <input 
        value={question} 
        onChange={e => setQuestion(e.target.value)} 
        onKeyDown={e => { if (e.key === 'Enter') ask(); }} 
        placeholder="Ej.: ¿Puedo permitirme comprar algo de $200.000? o ¿Qué debería reducir?" 
        className="flex-1 min-w-0 rounded-xl border border-zinc-800 bg-[#1C1F2A] px-4 py-3 text-xs text-white outline-none focus:border-purple-500 font-medium" 
      />
      <button onClick={() => ask()} className="rounded-xl bg-purple-500 hover:bg-purple-400 px-4 text-black font-extrabold flex items-center justify-center transition-colors" aria-label="Enviar pregunta">
        <Send className="w-4 h-4 text-black" />
      </button>
    </div>

    <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5">
      <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
      <p className="text-[11px] text-[#9AA6A0]">Money AI es estrictamente analítico y consultivo. No genera ni altera registros, cuentas ni presupuestos reales.</p>
    </div>
  </section>;
};
