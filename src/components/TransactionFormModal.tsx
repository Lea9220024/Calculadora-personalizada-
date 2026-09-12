import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, DollarSign, Tag, CreditCard, FileText, Repeat } from 'lucide-react';
import { Category, FinancialCard, PaymentMethod, Transaction, TransactionType } from '../types';
import { GradientIcon } from './GradientIcon';
import { getTodayDateString, PAYMENT_METHOD_LABELS } from '../utils/formatters';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  categories: Category[];
  cards: FinancialCard[];
  editingTransaction?: Transaction | null;
  currentMonthKey: string;
  currencySymbol: string;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({ isOpen, onClose, onSave, categories, cards, editingTransaction, currentMonthKey, currencySymbol }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tarjeta_debito');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [cardId, setCardId] = useState('');
  const [installments, setInstallments] = useState('1');

  const QUICK_EXPENSE_PRESETS = [
    { title: 'Supermercado', cat: 'comida' }, { title: 'Cena / Restaurante', cat: 'comida' }, { title: 'Combustible / Nafta', cat: 'transporte' },
    { title: 'Farmacia', cat: 'salud' }, { title: 'Factura Luz / Agua', cat: 'servicios' }, { title: 'Suscripción Streaming', cat: 'suscripciones' }
  ];

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type); setTitle(editingTransaction.title); setAmount(editingTransaction.amount.toString()); setCategoryId(editingTransaction.categoryId); setDate(editingTransaction.date); setPaymentMethod(editingTransaction.paymentMethod); setNotes(editingTransaction.notes || ''); setIsRecurring(editingTransaction.isRecurring || false); setCardId(editingTransaction.cardId || ''); setInstallments(String(editingTransaction.installmentTotal || 1));
    } else {
      setType('expense'); setTitle(''); setAmount('');
      const defaultCat = categories.find(c => c.type === 'expense' || c.type === 'both'); setCategoryId(defaultCat ? defaultCat.id : 'comida');
      const today = getTodayDateString(); setDate(today.startsWith(currentMonthKey) ? today : `${currentMonthKey}-01`);
      setPaymentMethod('tarjeta_debito'); setNotes(''); setIsRecurring(false); setCardId(''); setInstallments('1');
    }
  }, [editingTransaction, isOpen, currentMonthKey, categories]);

  if (!isOpen) return null;
  const filteredCategories = categories.filter(c => c.type === type || c.type === 'both');
  const activeCards = cards.filter(c => c.active);
  const selectedCard = activeCards.find(c => c.id === cardId);
  const isCreditCard = paymentMethod === 'tarjeta_credito' && !!selectedCard && selectedCard.type === 'credit';
  const installmentCount = Math.max(1, Math.min(48, Number(installments) || 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = parseFloat(amount);
    if (!title.trim() || isNaN(totalAmount) || totalAmount <= 0) return;
    const isInstallmentPurchase = type === 'expense' && isCreditCard && installmentCount > 1;
    const monthlyAmount = isInstallmentPurchase ? Math.round((totalAmount / installmentCount) * 100) / 100 : totalAmount;
    onSave({ title: title.trim(), amount: monthlyAmount, type, categoryId: categoryId || (filteredCategories[0]?.id || 'otros_gastos'), date, paymentMethod, notes: notes.trim() || undefined, isRecurring, cardId: selectedCard ? selectedCard.id : undefined, installmentTotal: isInstallmentPurchase ? installmentCount : undefined, installmentTotalAmount: isInstallmentPurchase ? totalAmount : undefined, installmentNumber: isInstallmentPurchase ? 1 : undefined });
    onClose();
  };

  const handleApplyPreset = (presetTitle: string, catId: string) => { setTitle(presetTitle); if (categories.some(c => c.id === catId)) setCategoryId(catId); };
  const setPayment = (method: PaymentMethod) => { setPaymentMethod(method); if (method !== 'tarjeta_credito') { setCardId(''); setInstallments('1'); } };

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"><div className="bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] text-zinc-100" onClick={e => e.stopPropagation()}>
    <div className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-800"><div className="flex items-center gap-2"><div className={`p-2 rounded-xl ${type === 'expense' ? 'bg-orange-500/10 text-orange-400' : 'bg-amber-500/10 text-amber-400'}`}><GradientIcon icon={DollarSign} className="w-5 h-5" strokeWidth={2.4} /></div><div><h3 className="font-extrabold text-lg leading-tight text-white">{editingTransaction ? 'Editar Registro' : 'Nuevo Registro'}</h3><p className="text-xs text-zinc-400">{editingTransaction ? 'Modifica los datos del movimiento' : 'Agrega un gasto o ingreso a tu historial'}</p></div></div><button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800" id="close-modal-btn"><GradientIcon icon={X} className="w-5 h-5" strokeWidth={2.2} /></button></div>
    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
      <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800"><button type="button" onClick={() => { setType('expense'); const c = categories.find(x => x.type === 'expense' || x.type === 'both'); if (c) setCategoryId(c.id); }} className={`py-2.5 px-4 rounded-lg font-extrabold text-xs sm:text-sm ${type === 'expense' ? 'bg-orange-500 text-black shadow-md' : 'text-zinc-400 hover:text-zinc-100'}`}>🟠 Gasto / Egreso</button><button type="button" onClick={() => { setType('income'); const c = categories.find(x => x.type === 'income' || x.type === 'both'); if (c) setCategoryId(c.id); setCardId(''); setInstallments('1'); }} className={`py-2.5 px-4 rounded-lg font-extrabold text-xs sm:text-sm ${type === 'income' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-zinc-100'}`}>🟡 Ingreso</button></div>
      {!editingTransaction && type === 'expense' && <div><span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">Atajos rápidos:</span><div className="flex flex-wrap gap-1.5">{QUICK_EXPENSE_PRESETS.map((p, idx) => <button key={idx} type="button" onClick={() => handleApplyPreset(p.title, p.cat)} className="text-xs px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-orange-400 rounded-lg border border-zinc-800">+ {p.title}</button>)}</div></div>}
      <div><label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">Monto ({currencySymbol}) *</label><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400 font-extrabold text-lg">{currencySymbol}</span><input type="number" step="0.01" min="0.01" required placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-black text-white text-xl" autoFocus id="amount-input" /></div>{isInstallmentPurchaseHint(paymentMethod, selectedCard) && <p className="mt-1.5 text-[11px] text-orange-400">Ingresá el total de la compra. C.R.E.A.M. calculará el importe mensual de cada cuota.</p>}</div>
      <div><label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">Concepto / Título *</label><input type="text" required placeholder="Ej. Compras supermercado, Alquiler, Café..." value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold text-zinc-100" id="title-input" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1"><GradientIcon icon={Tag} className="w-3.5 h-3.5" /><span>Categoría</span></label><select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-100" id="category-select">{filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1"><GradientIcon icon={Calendar} className="w-3.5 h-3.5" /><span>Fecha</span></label><input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-100" id="date-input" /></div></div>
      <div><label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1"><GradientIcon icon={CreditCard} className="w-3.5 h-3.5" /><span>Método de Pago</span></label><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(method => <button key={method} type="button" onClick={() => setPayment(method)} className={`py-2 px-2.5 rounded-lg border text-xs font-bold ${paymentMethod === method ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800'}`}>{PAYMENT_METHOD_LABELS[method]}</button>)}</div></div>
      {type === 'expense' && (paymentMethod === 'tarjeta_credito' || paymentMethod === 'tarjeta_debito') && <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-3"><div><label className="block text-xs font-bold text-zinc-300 mb-1">Tarjeta asociada</label><select value={cardId} onChange={e => { setCardId(e.target.value); if (cards.find(c => c.id === e.target.value)?.type !== 'credit') setInstallments('1'); }} className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-100"><option value="">Sin asociar</option>{activeCards.filter(c => c.type === (paymentMethod === 'tarjeta_credito' ? 'credit' : 'debit')).map(c => <option key={c.id} value={c.id}>{c.name}{c.last4 ? ` · •••• ${c.last4}` : ''}</option>)}</select>{activeCards.length === 0 && <p className="text-[11px] text-zinc-500 mt-1">Agregá tus tarjetas en la sección “Tarjetas” para asociarlas a los movimientos.</p>}</div>{isCreditCard && <div><label className="block text-xs font-bold text-zinc-300 mb-1">Cantidad de cuotas</label><select value={installments} onChange={e => setInstallments(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-100">{Array.from({ length: 48 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n === 1 ? '1 cuota' : `${n} cuotas`}</option>)}</select>{installmentCount > 1 && amount && <p className="text-xs font-bold text-orange-400 mt-2">Cuota estimada: {currencySymbol} {(parseFloat(amount) / installmentCount).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</p>}</div>}</div>}
      <div><label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1"><GradientIcon icon={FileText} className="w-3.5 h-3.5" /><span>Notas opcionales</span></label><textarea rows={2} placeholder="Detalles adicionales, número de ticket..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-medium" id="notes-input" /></div>
      <div className="flex items-center gap-2 pt-1"><input type="checkbox" id="is-recurring-check" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="w-4 h-4 text-orange-500 border-zinc-700 bg-zinc-950 rounded" /><label htmlFor="is-recurring-check" className="text-xs font-medium text-zinc-300 cursor-pointer flex items-center gap-1.5"><GradientIcon icon={Repeat} className="w-3.5 h-3.5" /><span>Marcar como gasto recurrente</span></label></div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800"><button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800">Cancelar</button><button type="submit" className={`px-5 py-2.5 rounded-xl text-black font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-1.5 ${type === 'expense' ? 'bg-orange-500 hover:bg-orange-400' : 'bg-amber-500 hover:bg-amber-400'}`} id="submit-modal-btn"><Plus className="w-4 h-4 text-black" /><span>{editingTransaction ? 'Guardar Cambios' : 'Registrar Movimiento'}</span></button></div>
    </form>
  </div></div>;
};

const isInstallmentPurchaseHint = (paymentMethod: PaymentMethod, card?: FinancialCard) => paymentMethod === 'tarjeta_credito' && card?.type === 'credit';
