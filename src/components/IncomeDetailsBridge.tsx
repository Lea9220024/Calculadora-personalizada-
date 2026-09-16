import React, { useEffect, useState } from 'react';
import { Category, Transaction } from '../types';
import { formatCurrency, formatDateSpanish, formatMonthYear } from '../utils/formatters';

interface Props { transactions: Transaction[]; categories: Category[]; currentMonthKey: string; currencySymbol: string; hideValues?: boolean; }

export const IncomeDetailsBridge: React.FC<Props> = ({ transactions, categories, currentMonthKey, currencySymbol, hideValues=false }) => {
  const [open, setOpen] = useState(false);
  const incomeTransactions = transactions.filter(t => t.type === 'income' && t.date.startsWith(currentMonthKey));
  const val=(n:number)=>hideValues?'••••••':formatCurrency(n,currencySymbol);
  useEffect(()=>{
    const findCard=()=>Array.from(document.querySelectorAll<HTMLElement>('div')).find(el=>el.textContent?.includes(`Ingresos Mes (${formatMonthYear(currentMonthKey)})`) && el.textContent?.includes('operaciones') && el.className.includes('cursor-pointer'));
    const card=findCard();
    if(!card)return;
    const handler=(event:Event)=>{event.stopPropagation();setOpen(true)};
    card.addEventListener('click',handler);
    return()=>card.removeEventListener('click',handler);
  },[currentMonthKey, incomeTransactions.length]);
  if(!open)return null;
  const total=incomeTransactions.reduce((s,t)=>s+t.amount,0);
  return <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={()=>setOpen(false)}>
    <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#171B26] shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">Detalle de ingresos</p><h3 className="text-lg font-extrabold text-white mt-1">{formatMonthYear(currentMonthKey)}</h3></div><button onClick={()=>setOpen(false)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold">Cerrar</button></div>
      <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">{incomeTransactions.map(tx=>{const category=categories.find(c=>c.id===tx.categoryId);return <div key={tx.id} className="rounded-xl border border-zinc-800 bg-[#1C1F2A] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold text-white">{tx.title}</p><p className="text-xs text-[#9AA6A0] mt-1">{formatDateSpanish(tx.date)} · {category?.name ?? 'Sin categoría'}</p></div><p className="font-extrabold text-emerald-400 font-mono">{val(tx.amount)}</p></div>{tx.notes&&<p className="text-xs text-zinc-400 mt-2">{tx.notes}</p>}</div>})}<div className="flex justify-between items-center pt-2 border-t border-zinc-800"><span className="text-xs font-bold text-[#9AA6A0]">Total de ingresos</span><span className="font-extrabold text-white font-mono">{val(total)}</span></div></div>
    </div>
  </div>;
};
