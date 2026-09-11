import React, { useState, useEffect } from 'react';
import { Category, MonthlyBudget, Transaction, ViewTab, AppSettings } from './types';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, INITIAL_BUDGET, INITIAL_TRANSACTIONS } from './data/initialData';
import { Header } from './components/Header';
import { GlobalGradientDefs } from './components/GradientIcon';
import { SummaryCards } from './components/SummaryCards';
import { TransactionList } from './components/TransactionList';
import { BudgetOverview } from './components/BudgetOverview';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { CategoryManager } from './components/CategoryManager';
import { TransactionFormModal } from './components/TransactionFormModal';
import { ExportImportModal } from './components/ExportImportModal';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { getCurrentMonthKey } from './utils/formatters';

const STORAGE_KEYS = { TRANSACTIONS: 'mis_gastos_transactions_v1', CATEGORIES: 'mis_gastos_categories_v1', BUDGETS: 'mis_gastos_budgets_v1', SETTINGS: 'mis_gastos_settings_v1' };
const createTransactionId = () => typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? `tx-${crypto.randomUUID()}` : `tx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function App() {
  const [currentMonthKey, setCurrentMonthKey] = useState<string>(getCurrentMonthKey());
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); } return INITIAL_TRANSACTIONS; });
  const [categories, setCategories] = useState<Category[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); } return DEFAULT_CATEGORIES; });
  const [budgets, setBudgets] = useState<MonthlyBudget[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); } return INITIAL_BUDGET.monthKey ? [INITIAL_BUDGET] : []; });
  const [settings, setSettings] = useState<AppSettings>(() => { try { const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); } return DEFAULT_SETTINGS; });
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isSupabaseSyncOpen, setIsSupabaseSyncOpen] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);

  const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonthKey));
  const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const currentBudget = budgets.find(b => b.monthKey === currentMonthKey) || { monthKey: currentMonthKey, totalTarget: 0, categoryTargets: {} };
  const handleSaveTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => { if (editingTransaction) { setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...t, ...txData } : t)); setEditingTransaction(null); } else setTransactions(prev => [{ ...txData, id: createTransactionId(), createdAt: new Date().toISOString() }, ...prev]); };
  const handleDuplicateTransaction = (tx: Transaction) => setTransactions(prev => [{ ...tx, id: createTransactionId(), title: `${tx.title} (Copia)`, createdAt: new Date().toISOString() }, ...prev]);
  const handleDeleteTransaction = (id: string) => { if (window.confirm('¿Seguro que deseas borrar este registro?')) setTransactions(prev => prev.filter(t => t.id !== id)); };
  const handleUpdateBudget = (newBudget: MonthlyBudget) => setBudgets(prev => prev.some(b => b.monthKey === newBudget.monthKey) ? prev.map(b => b.monthKey === newBudget.monthKey ? newBudget : b) : [...prev, newBudget]);
  const handleAddCategory = (newCat: Omit<Category, 'id'>) => setCategories(prev => [...prev, { ...newCat, id: `cat-${Date.now()}` }]);
  const handleUpdateCategory = (updated: Category) => setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
  const handleDeleteCategory = (id: string) => { if (window.confirm('¿Deseas eliminar esta categoría?')) setCategories(prev => prev.filter(c => c.id !== id)); };
  const handleImportFullData = (imported: { transactions: Transaction[]; categories: Category[]; budgets: MonthlyBudget[] }) => { setTransactions(imported.transactions); setCategories(imported.categories); setBudgets(imported.budgets); };
  const handleResetSampleData = () => { setTransactions(INITIAL_TRANSACTIONS); setCategories(DEFAULT_CATEGORIES); setBudgets(INITIAL_BUDGET.monthKey ? [INITIAL_BUDGET] : []); setSettings(DEFAULT_SETTINGS); };

  return <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col selection:bg-orange-500 selection:text-black">
    <GlobalGradientDefs />
    <Header currentMonthKey={currentMonthKey} onMonthChange={setCurrentMonthKey} activeTab={activeTab} onTabChange={setActiveTab} onOpenNewTransaction={() => { setEditingTransaction(null); setIsFormModalOpen(true); }} onOpenExportImport={() => setIsExportImportOpen(true)} onOpenSupabaseSync={() => setIsSupabaseSyncOpen(true)} currencySymbol={settings.currencySymbol} onCurrencyChange={(sym) => setSettings(s => ({ ...s, currencySymbol: sym }))} />
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {(activeTab === 'dashboard' || activeTab === 'transactions') && <SummaryCards totalIncome={monthIncome} totalExpenses={monthExpenses} budgetTarget={currentBudget.totalTarget} currencySymbol={settings.currencySymbol} onEditBudgetClick={() => setActiveTab('budgets')} />}
      {activeTab === 'dashboard' && <div className="space-y-6"><div className="grid grid-cols-1 lg:grid-cols-12 gap-6"><div className="lg:col-span-7 space-y-6"><TransactionList transactions={monthTransactions} categories={categories} currencySymbol={settings.currencySymbol} onEdit={(tx) => { setEditingTransaction(tx); setIsFormModalOpen(true); }} onDuplicate={handleDuplicateTransaction} onDelete={handleDeleteTransaction} onAddNew={() => { setEditingTransaction(null); setIsFormModalOpen(true); }} /></div><div className="lg:col-span-5 space-y-6"><BudgetOverview currentMonthKey={currentMonthKey} monthlyBudget={currentBudget} transactions={monthTransactions} categories={categories} currencySymbol={settings.currencySymbol} onUpdateBudget={handleUpdateBudget} /></div></div><AnalyticsCharts transactions={monthTransactions} categories={categories} currencySymbol={settings.currencySymbol} /></div>}
      {activeTab === 'transactions' && <TransactionList transactions={monthTransactions} categories={categories} currencySymbol={settings.currencySymbol} onEdit={(tx) => { setEditingTransaction(tx); setIsFormModalOpen(true); }} onDuplicate={handleDuplicateTransaction} onDelete={handleDeleteTransaction} onAddNew={() => { setEditingTransaction(null); setIsFormModalOpen(true); }} />}
      {activeTab === 'budgets' && <BudgetOverview currentMonthKey={currentMonthKey} monthlyBudget={currentBudget} transactions={monthTransactions} categories={categories} currencySymbol={settings.currencySymbol} onUpdateBudget={handleUpdateBudget} />}
      {activeTab === 'analytics' && <AnalyticsCharts transactions={monthTransactions} categories={categories} currencySymbol={settings.currencySymbol} />}
      {activeTab === 'categories' && <CategoryManager categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} />}
    </main>
    <footer className="bg-zinc-950 border-t border-zinc-800 text-zinc-400 py-6 mt-12"><div className="max-w-7xl mx-auto px-4 text-center text-xs space-y-1"><p className="font-semibold text-zinc-300">Control de Gastos Mensuales — Uso Personal (Pesos Argentinos - ARS)</p><p className="text-zinc-500">Los datos se guardan de forma privada en tu navegador. Puedes exportar o respaldar en cualquier momento.</p></div></footer>
    <TransactionFormModal isOpen={isFormModalOpen} onClose={() => { setIsFormModalOpen(false); setEditingTransaction(null); }} onSave={handleSaveTransaction} categories={categories} editingTransaction={editingTransaction} currentMonthKey={currentMonthKey} currencySymbol={settings.currencySymbol} />
    <ExportImportModal isOpen={isExportImportOpen} onClose={() => setIsExportImportOpen(false)} transactions={transactions} categories={categories} budgets={budgets} settings={settings} onImportFullData={handleImportFullData} onResetSampleData={handleResetSampleData} />
    <SupabaseSyncModal isOpen={isSupabaseSyncOpen} onClose={() => setIsSupabaseSyncOpen(false)} transactions={transactions} categories={categories} budgets={budgets} settings={settings} />
  </div>;
}
