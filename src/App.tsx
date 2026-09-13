import React, { useState, useEffect } from 'react';
import { Category, FinancialCard, InstallmentPlan, MonthlyBudget, NetWorthSnapshot, PatrimonyItem, Subscription, FutureCommitment, Transaction, ViewTab, AppSettings } from './types';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, INITIAL_BUDGET, INITIAL_TRANSACTIONS } from './data/initialData';
import { Header } from './components/Header';
import { GlobalGradientDefs } from './components/GradientIcon';
import { SummaryCards } from './components/SummaryCards';
import { TransactionList } from './components/TransactionList';
import { BudgetOverview } from './components/BudgetOverview';
import { FinancialIntelligence } from './components/FinancialIntelligence';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { HistoricalAnalysis } from './components/HistoricalAnalysis';
import { FinancialGoals } from './components/FinancialGoals';
import { CardsAndInstallments } from './components/CardsAndInstallments';
import { Subscriptions } from './components/Subscriptions';
import { CategoryManager } from './components/CategoryManager';
import { Patrimony } from './components/Patrimony';
import { FutureCommitments } from './components/FutureCommitments';
import { MoneyAI } from './components/MoneyAI';
import { SmartAlerts } from './components/SmartAlerts';
import { TransactionFormModal } from './components/TransactionFormModal';
import { ExportImportModal } from './components/ExportImportModal';
import { SafeImportModal } from './components/SafeImportModal';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { getCurrentMonthKey } from './utils/formatters';
import { categorizeTransaction } from './utils/autoCategorization';
import { supabase } from './lib/supabase';
import { readUserDataFromSupabase } from './lib/supabaseRead';
import { subscribeToCalculatorRealtime, unsubscribeFromCalculatorRealtime } from './lib/supabaseRealtime';
import { deleteCategoryFromSupabase, deletePatrimonyItemFromSupabase, deleteTransactionFromSupabase, syncBudgetToSupabase, syncCategoryToSupabase, syncNetWorthSnapshotToSupabase, syncPatrimonyItemToSupabase, syncSettingsToSupabase, syncTransactionToSupabase } from './lib/supabaseWrite';

const STORAGE_KEYS = { TRANSACTIONS: 'mis_gastos_transactions_v1', CATEGORIES: 'mis_gastos_categories_v1', BUDGETS: 'mis_gastos_budgets_v1', SETTINGS: 'mis_gastos_settings_v1', CARDS: 'cream_financial_cards_v1', INSTALLMENTS: 'cream_installment_plans_v1', SUBSCRIPTIONS: 'cream_subscriptions_v1', PATRIMONY: 'cream_patrimony_v1', NET_WORTH: 'cream_net_worth_v1', COMMITMENTS: 'cream_future_commitments_v1' };
const createTransactionId = () => typeof crypto !== 'undefined' && typeof crypto['randomUUID'] === 'function' ? `tx-${crypto['randomUUID']}` : `tx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const createId = (prefix: string) => typeof crypto !== 'undefined' && typeof crypto['randomUUID'] === 'function' ? `${prefix}-${crypto['randomUUID']}` : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const syncInBackground = (operation: () => Promise<void>, label: string) => { void operation().catch((error) => console.warn(`No se pudo sincronizar ${label} con Supabase. La copia local se mantiene.`, error)); };

export default function App() {
  const [currentMonthKey, setCurrentMonthKey] = useState<string>(getCurrentMonthKey());
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); } return INITIAL_TRANSACTIONS; });
  const [categories, setCategories] = useState<Category[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); } return DEFAULT_CATEGORIES; });
  const [budgets, setBudgets] = useState<MonthlyBudget[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); } return INITIAL_BUDGET.monthKey ? [INITIAL_BUDGET] : []; });
  const [settings, setSettings] = useState<AppSettings>(() => { try { const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS); if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }; } catch (e) { console.error(e); } return DEFAULT_SETTINGS; });
  const [cards, setCards] = useState<FinancialCard[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEYS.CARDS); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); } return []; });
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEYS.INSTALLMENTS); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); } return []; });
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); } return []; });
  const [patrimonyItems, setPatrimonyItems] = useState<PatrimonyItem[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEYS.PATRIMONY); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); } return []; });
  const [netWorthSnapshots, setNetWorthSnapshots] = useState<NetWorthSnapshot[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEYS.NET_WORTH); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); } return []; });
  const [futureCommitments, setFutureCommitments] = useState<FutureCommitment[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEYS.COMMITMENTS); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); } return []; });
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isSafeImportOpen, setIsSafeImportOpen] = useState(false);
  const [isSupabaseSyncOpen, setIsSupabaseSyncOpen] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards)); }, [cards]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(installmentPlans)); }, [installmentPlans]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions)); }, [subscriptions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PATRIMONY, JSON.stringify(patrimonyItems)); }, [patrimonyItems]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.NET_WORTH, JSON.stringify(netWorthSnapshots)); }, [netWorthSnapshots]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.COMMITMENTS, JSON.stringify(futureCommitments)); }, [futureCommitments]);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => { const isLight = settings.theme === 'light' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches); root.classList.toggle('theme-light', isLight); root.classList.toggle('theme-dark', !isLight); root.style.colorScheme = isLight ? 'light' : 'dark'; };
    applyTheme(); if (settings.theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: light)'); const handleChange = () => applyTheme(); media.addEventListener?.('change', handleChange); return () => media.removeEventListener?.('change', handleChange);
  }, [settings.theme]);
  useEffect(() => { const orientation = window.screen?.orientation; try { orientation?.unlock?.(); } catch {} }, []);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false; let loadingUserId: string | null = null; let realtimeChannel: ReturnType<typeof subscribeToCalculatorRealtime> = null;
    const loadCloudData = async (userId: string) => { if (cancelled || loadingUserId === userId) return; loadingUserId = userId; try { const cloudData = await readUserDataFromSupabase(userId); if (cancelled) return; setTransactions(cloudData.transactions); setCategories(cloudData.categories); setBudgets(cloudData.budgets); if (cloudData.settings) setSettings(prev => ({ ...prev, ...cloudData.settings })); setPatrimonyItems(cloudData.patrimonyItems); setNetWorthSnapshots(cloudData.netWorthSnapshots); } catch (error) { console.warn('No se pudieron cargar los datos desde Supabase. Se mantiene la copia local.', error); } finally { if (loadingUserId === userId) loadingUserId = null; } };
    const startRealtime = (userId: string) => { if (cancelled || realtimeChannel) return; realtimeChannel = subscribeToCalculatorRealtime(userId, () => { void loadCloudData(userId); }); };
    const loadCurrentSession = async () => { const { data: { session } } = await supabase.auth.getSession(); if (!cancelled && session?.user) { await loadCloudData(session.user.id); startRealtime(session.user.id); } };
    void loadCurrentSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => { if (cancelled) return; if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) void loadCloudData(session.user.id).then(() => startRealtime(session.user.id)); if (event === 'SIGNED_OUT' && realtimeChannel) { void unsubscribeFromCalculatorRealtime(realtimeChannel); realtimeChannel = null; } });
    return () => { cancelled = true; authListener.subscription.unsubscribe(); if (realtimeChannel) void unsubscribeFromCalculatorRealtime(realtimeChannel); };
  }, []);

  const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonthKey));
  const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const currentBudget = budgets.find(b => b.monthKey === currentMonthKey) || { monthKey: currentMonthKey, totalTarget: 0, categoryTargets: {} };

  const handleSaveTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => { if (editingTransaction) { const updatedTransaction = { ...editingTransaction, ...txData }; setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? updatedTransaction : t)); syncInBackground(() => syncTransactionToSupabase(updatedTransaction), 'el movimiento'); setEditingTransaction(null); } else { const planId = txData.installmentTotal && txData.installmentTotal > 1 && txData.cardId ? createId('installment') : undefined; const newTx: Transaction = { ...txData, id: createTransactionId(), installmentPlanId: planId, createdAt: new Date().toISOString() }; const defaultCategoryId = categories.find(c => c.type === newTx.type || c.type === 'both')?.id; const categorized = newTx.categoryId === defaultCategoryId ? categorizeTransaction(newTx, categories, transactions) : newTx; const finalTx = planId ? { ...categorized, installmentPlanId: planId } : categorized; setTransactions(prev => [finalTx, ...prev]); syncInBackground(() => syncTransactionToSupabase(finalTx), 'el movimiento'); if (planId && finalTx.cardId && finalTx.installmentTotal && finalTx.installmentTotalAmount) { const plan: InstallmentPlan = { id: planId, cardId: finalTx.cardId, title: finalTx.title, totalAmount: finalTx.installmentTotalAmount, installmentAmount: finalTx.amount, installments: finalTx.installmentTotal, currentInstallment: 1, startDate: finalTx.date, transactionId: finalTx.id, notes: finalTx.notes, createdAt: finalTx.createdAt }; setInstallmentPlans(prev => [plan, ...prev]); } } };
  const handleDuplicateTransaction = (tx: Transaction) => { const duplicated: Transaction = { ...tx, id: createTransactionId(), title: `${tx.title} (Copia)`, createdAt: new Date().toISOString() }; setTransactions(prev => [duplicated, ...prev]); syncInBackground(() => syncTransactionToSupabase(duplicated), 'el movimiento duplicado'); };
  const handleDeleteTransaction = (id: string) => { if (window.confirm('¿Seguro que deseas borrar este registro?')) { setTransactions(prev => prev.filter(t => t.id !== id)); syncInBackground(() => deleteTransactionFromSupabase(id), 'la eliminación del movimiento'); } };
  const handleUpdateBudget = (newBudget: MonthlyBudget) => { setBudgets(prev => prev.some(b => b.monthKey === newBudget.monthKey) ? prev.map(b => b.monthKey === newBudget.monthKey ? newBudget : b) : [...prev, newBudget]); syncInBackground(() => syncBudgetToSupabase(newBudget), 'el presupuesto'); };
  const handleAddCategory = (newCat: Omit<Category, 'id'>) => { const created: Category = { ...newCat, id: `cat-${Date.now()}` }; setCategories(prev => [...prev, created]); syncInBackground(() => syncCategoryToSupabase(created), 'la categoría'); };
  const handleUpdateCategory = (updated: Category) => { setCategories(prev => prev.map(c => c.id === updated.id ? updated : c)); syncInBackground(() => syncCategoryToSupabase(updated), 'la categoría'); };
  const handleDeleteCategory = (id: string) => { if (window.confirm('¿Deseas eliminar esta categoría?')) { setCategories(prev => prev.filter(c => c.id !== id)); syncInBackground(() => deleteCategoryFromSupabase(id), 'la eliminación de la categoría'); } };
  const handleAddCard = (newCard: Omit<FinancialCard, 'id' | 'createdAt'>) => { const card: FinancialCard = { ...newCard, id: createId('card'), createdAt: new Date().toISOString() }; setCards(prev => [card, ...prev]); };
  const handleUpdateCard = (updated: FinancialCard) => setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
  const handleDeleteCard = (id: string) => setCards(prev => prev.filter(c => c.id !== id));
  const handleAddSubscription = (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => { const now = new Date().toISOString(); const subscription: Subscription = { ...data, id: createId('subscription'), createdAt: now, updatedAt: now }; setSubscriptions(prev => [subscription, ...prev]); };
  const handleUpdateSubscription = (updated: Subscription) => setSubscriptions(prev => prev.map(s => s.id === updated.id ? updated : s));
  const handleDeleteSubscription = (id: string) => setSubscriptions(prev => prev.filter(s => s.id !== id));
  const handleAddPatrimony = (data: Omit<PatrimonyItem, 'id' | 'createdAt' | 'updatedAt'>) => { const now = new Date().toISOString(); const item: PatrimonyItem = { ...data, id: createId('asset'), createdAt: now, updatedAt: now }; setPatrimonyItems(prev => [item, ...prev]); syncInBackground(() => syncPatrimonyItemToSupabase(item), 'el patrimonio'); };
  const handleUpdatePatrimony = (item: PatrimonyItem) => { const updated = { ...item, updatedAt: new Date().toISOString() }; setPatrimonyItems(prev => prev.map(i => i.id === updated.id ? updated : i)); syncInBackground(() => syncPatrimonyItemToSupabase(updated), 'el patrimonio'); };
  const handleDeletePatrimony = (id: string) => { if (window.confirm('¿Eliminar este registro patrimonial?')) { setPatrimonyItems(prev => prev.filter(i => i.id !== id)); syncInBackground(() => deletePatrimonyItemFromSupabase(id), 'la eliminación del patrimonio'); } };
  useEffect(() => { if (!patrimonyItems.length) return; const totalAssets = patrimonyItems.filter(i => i.type === 'asset').reduce((s, i) => s + i.value, 0); const totalLiabilities = patrimonyItems.filter(i => i.type === 'liability').reduce((s, i) => s + i.value, 0); const snapshotDate = new Date().toISOString().slice(0, 10); const snapshot: NetWorthSnapshot = { id: createId('snapshot'), snapshotDate, totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities, createdAt: new Date().toISOString() }; setNetWorthSnapshots(prev => { const existing = prev.find(s => s.snapshotDate === snapshotDate); return existing ? prev.map(s => s.snapshotDate === snapshotDate ? { ...s, totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities } : s) : [snapshot, ...prev]; }); syncInBackground(() => syncNetWorthSnapshotToSupabase(snapshot), 'el historial patrimonial'); }, [patrimonyItems]);
  const handleAddCommitment = (data: Omit<FutureCommitment, 'id' | 'createdAt' | 'updatedAt'>) => { const now = new Date().toISOString(); setFutureCommitments(prev => [{ ...data, id: createId('commitment'), createdAt: now, updatedAt: now }, ...prev]); };
  const handleUpdateCommitment = (item: FutureCommitment) => setFutureCommitments(prev => prev.map(c => c.id === item.id ? { ...item, updatedAt: new Date().toISOString() } : c));
  const handleDeleteCommitment = (id: string) => { if (window.confirm('¿Eliminar este compromiso futuro?')) setFutureCommitments(prev => prev.filter(c => c.id !== id)); };
  const handleCurrencyChange = (sym: string) => { const nextSettings = { ...settings, currencySymbol: sym }; setSettings(nextSettings); syncInBackground(() => syncSettingsToSupabase(nextSettings), 'la configuración'); };
  const handleThemeChange = (theme: AppSettings['theme']) => { const nextSettings = { ...settings, theme }; setSettings(nextSettings); syncInBackground(() => syncSettingsToSupabase(nextSettings), 'el tema visual'); };
  const handleImportFullData = (imported: { transactions: Transaction[]; categories: Category[]; budgets: MonthlyBudget[]; settings: AppSettings }) => { setTransactions(imported.transactions); setCategories(imported.categories); setBudgets(imported.budgets); setSettings({ ...DEFAULT_SETTINGS, ...imported.settings }); };
  const handleSafeImportTransactions = (imported: Transaction[]) => { setTransactions(prev => [...imported, ...prev]); imported.forEach(tx => syncInBackground(() => syncTransactionToSupabase(tx), 'el movimiento importado')); };
  const handleResetSampleData = () => { setTransactions(INITIAL_TRANSACTIONS); setCategories(DEFAULT_CATEGORIES); setBudgets(INITIAL_BUDGET.monthKey ? [INITIAL_BUDGET] : []); setSettings(DEFAULT_SETTINGS); };

  return <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col selection:bg-orange-500 selection:text-black">
    <GlobalGradientDefs />
    <Header currentMonthKey={currentMonthKey} onMonthChange={setCurrentMonthKey} activeTab={activeTab} onTabChange={setActiveTab} onOpenNewTransaction={() => { setEditingTransaction(null); setIsFormModalOpen(true); }} onOpenExportImport={() => setIsExportImportOpen(true)} onOpenSupabaseSync={() => setIsSupabaseSyncOpen(true)} currencySymbol={settings.currencySymbol} onCurrencyChange={handleCurrencyChange} theme={settings.theme} onThemeChange={handleThemeChange} />
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {(activeTab === 'dashboard' || activeTab === 'transactions') && <SummaryCards totalIncome={monthIncome} totalExpenses={monthExpenses} budgetTarget={currentBudget.totalTarget} currencySymbol={settings.currencySymbol} onEditBudgetClick={() => setActiveTab('budgets')} />}
      {activeTab === 'dashboard' && <div className="space-y-6"><div className="grid grid-cols-1 lg:grid-cols-12 gap-6"><div className="lg:col-span-7 space-y-6"><TransactionList transactions={monthTransactions} categories={categories} currencySymbol={settings.currencySymbol} onEdit={tx => { setEditingTransaction(tx); setIsFormModalOpen(true); }} onDuplicate={handleDuplicateTransaction} onDelete={handleDeleteTransaction} onAddNew={() => { setEditingTransaction(null); setIsFormModalOpen(true); }} /></div><div className="lg:col-span-5 space-y-6"><BudgetOverview currentMonthKey={currentMonthKey} monthlyBudget={currentBudget} transactions={monthTransactions} categories={categories} currencySymbol={settings.currencySymbol} onUpdateBudget={handleUpdateBudget} /></div></div><SmartAlerts currentMonthKey={currentMonthKey} transactions={transactions} categories={categories} budgetTarget={currentBudget.totalTarget} commitments={futureCommitments} installmentPlans={installmentPlans} subscriptions={subscriptions} cards={cards} currencySymbol={settings.currencySymbol} /><FinancialIntelligence currentMonthKey={currentMonthKey} budgetTarget={currentBudget.totalTarget} transactions={monthTransactions} currencySymbol={settings.currencySymbol} /><FinancialGoals transactions={transactions} currencySymbol={settings.currencySymbol} /><AnalyticsCharts transactions={monthTransactions} categories={categories} currencySymbol={settings.currencySymbol} /><HistoricalAnalysis transactions={transactions} currencySymbol={settings.currencySymbol} /></div>}
      {activeTab === 'transactions' && <TransactionList transactions={monthTransactions} categories={categories} currencySymbol={settings.currencySymbol} onEdit={tx => { setEditingTransaction(tx); setIsFormModalOpen(true); }} onDuplicate={handleDuplicateTransaction} onDelete={handleDeleteTransaction} onAddNew={() => { setEditingTransaction(null); setIsFormModalOpen(true); }} />}
      {activeTab === 'budgets' && <><FinancialIntelligence currentMonthKey={currentMonthKey} budgetTarget={currentBudget.totalTarget} transactions={monthTransactions} currencySymbol={settings.currencySymbol} /><div className="mt-6"><BudgetOverview currentMonthKey={currentMonthKey} monthlyBudget={currentBudget} transactions={monthTransactions} categories={categories} currencySymbol={settings.currencySymbol} onUpdateBudget={handleUpdateBudget} /></div></>}
      {activeTab === 'analytics' && <><AnalyticsCharts transactions={monthTransactions} categories={categories} currencySymbol={settings.currencySymbol} /><HistoricalAnalysis transactions={transactions} currencySymbol={settings.currencySymbol} /><div className="mt-6"><FinancialGoals transactions={transactions} currencySymbol={settings.currencySymbol} /></div></>}
      {activeTab === 'money-ai' && <MoneyAI currentMonthKey={currentMonthKey} transactions={transactions} categories={categories} budget={currentBudget} commitments={futureCommitments} installmentPlans={installmentPlans} subscriptions={subscriptions} patrimonyItems={patrimonyItems} cards={cards} currencySymbol={settings.currencySymbol} />}
      {activeTab === 'patrimony' && <Patrimony items={patrimonyItems} snapshots={netWorthSnapshots} currencySymbol={settings.currencySymbol} onAdd={handleAddPatrimony} onUpdate={handleUpdatePatrimony} onDelete={handleDeletePatrimony} />}
      {activeTab === 'commitments' && <FutureCommitments commitments={futureCommitments} installmentPlans={installmentPlans} subscriptions={subscriptions} transactions={transactions} categories={categories} cards={cards} currencySymbol={settings.currencySymbol} onAdd={handleAddCommitment} onUpdate={handleUpdateCommitment} onDelete={handleDeleteCommitment} />}
      {activeTab === 'cards' && <CardsAndInstallments cards={cards} installmentPlans={installmentPlans} transactions={transactions} currentMonthKey={currentMonthKey} currencySymbol={settings.currencySymbol} onAddCard={handleAddCard} onUpdateCard={handleUpdateCard} onDeleteCard={handleDeleteCard} />}
      {activeTab === 'subscriptions' && <Subscriptions subscriptions={subscriptions} categories={categories} cards={cards} transactions={transactions} currentMonthKey={currentMonthKey} currencySymbol={settings.currencySymbol} onAdd={handleAddSubscription} onUpdate={handleUpdateSubscription} onDelete={handleDeleteSubscription} />}
      {activeTab === 'categories' && <CategoryManager categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} />}
    </main>
    <TransactionFormModal isOpen={isFormModalOpen} onClose={() => { setIsFormModalOpen(false); setEditingTransaction(null); }} onSave={handleSaveTransaction} editingTransaction={editingTransaction} categories={categories} cards={cards} currentMonthKey={currentMonthKey} currencySymbol={settings.currencySymbol} />
    <ExportImportModal isOpen={isExportImportOpen} onClose={() => setIsExportImportOpen(false)} transactions={transactions} categories={categories} budgets={budgets} settings={settings} onImportFullData={handleImportFullData} onResetSampleData={handleResetSampleData} onOpenSafeImport={() => { setIsExportImportOpen(false); setIsSafeImportOpen(true); }} />
    <SafeImportModal isOpen={isSafeImportOpen} onClose={() => setIsSafeImportOpen(false)} transactions={transactions} categories={categories} onImportTransactions={handleSafeImportTransactions} />
    <SupabaseSyncModal isOpen={isSupabaseSyncOpen} onClose={() => setIsSupabaseSyncOpen(false)} transactions={transactions} categories={categories} budgets={budgets} settings={settings} />
  </div>;
}