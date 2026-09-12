import React, { useState, useEffect } from 'react';
import {
  Category,
  MonthlyBudget,
  Transaction,
  ViewTab,
  AppSettings
} from './types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  INITIAL_BUDGET,
  INITIAL_TRANSACTIONS
} from './data/initialData';
import { Header } from './components/Header';
import { GlobalGradientDefs } from './components/GradientIcon';
import { SummaryCards } from './components/SummaryCards';
import { TransactionList } from './components/TransactionList';
import { BudgetOverview } from './components/BudgetOverview';
import { FinancialIntelligence } from './components/FinancialIntelligence';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { HistoricalAnalysis } from './components/HistoricalAnalysis';
import { CategoryManager } from './components/CategoryManager';
import { TransactionFormModal } from './components/TransactionFormModal';
import { ExportImportModal } from './components/ExportImportModal';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { getCurrentMonthKey } from './utils/formatters';
import { supabase } from './lib/supabase';
import { readUserDataFromSupabase } from './lib/supabaseRead';
import { subscribeToCalculatorRealtime, unsubscribeFromCalculatorRealtime } from './lib/supabaseRealtime';
import {
  deleteCategoryFromSupabase,
  deleteTransactionFromSupabase,
  syncBudgetToSupabase,
  syncCategoryToSupabase,
  syncSettingsToSupabase,
  syncTransactionToSupabase,
} from './lib/supabaseWrite';

const STORAGE_KEYS = {
  TRANSACTIONS: 'mis_gastos_transactions_v1',
  CATEGORIES: 'mis_gastos_categories_v1',
  BUDGETS: 'mis_gastos_budgets_v1',
  SETTINGS: 'mis_gastos_settings_v1'
};

const createTransactionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto['randomUUID'] === 'function') {
    return `tx-${crypto['randomUUID']()}`;
  }
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const syncInBackground = (operation: () => Promise<void>, label: string) => {
  void operation().catch((error) => {
    console.warn(`No se pudo sincronizar ${label} con Supabase. La copia local se mantiene.`, error);
  });
};

export default function App() {
  const [currentMonthKey, setCurrentMonthKey] = useState<string>(getCurrentMonthKey());
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TRANSACTIONS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CATEGORIES;
  });

  const [budgets, setBudgets] = useState<MonthlyBudget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_BUDGET.monthKey ? [INITIAL_BUDGET] : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isSupabaseSyncOpen, setIsSupabaseSyncOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;
    let loadingUserId: string | null = null;
    let realtimeChannel: ReturnType<typeof subscribeToCalculatorRealtime> = null;

    const loadCloudData = async (userId: string) => {
      if (cancelled || loadingUserId === userId) return;
      loadingUserId = userId;

      try {
        const cloudData = await readUserDataFromSupabase(userId);
        if (cancelled) return;

        setTransactions(cloudData.transactions);
        setCategories(cloudData.categories);
        setBudgets(cloudData.budgets);
        if (cloudData.settings) setSettings(cloudData.settings);
      } catch (error) {
        console.warn('No se pudieron cargar los datos desde Supabase. Se mantiene la copia local.', error);
      } finally {
        if (loadingUserId === userId) loadingUserId = null;
      }
    };

    const startRealtime = (userId: string) => {
      if (cancelled || realtimeChannel) return;
      realtimeChannel = subscribeToCalculatorRealtime(userId, () => {
        void loadCloudData(userId);
      });
    };

    const loadCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled && session?.user) {
        await loadCloudData(session.user.id);
        startRealtime(session.user.id);
      }
    };

    void loadCurrentSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        void loadCloudData(session.user.id).then(() => startRealtime(session.user.id));
      }
      if (event === 'SIGNED_OUT' && realtimeChannel) {
        void unsubscribeFromCalculatorRealtime(realtimeChannel);
        realtimeChannel = null;
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
      if (realtimeChannel) {
        void unsubscribeFromCalculatorRealtime(realtimeChannel);
      }
    };
  }, []);

  const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonthKey));

  const monthIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBudget = budgets.find(b => b.monthKey === currentMonthKey) || {
    monthKey: currentMonthKey,
    totalTarget: 0,
    categoryTargets: {}
  };

  const handleSaveTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editingTransaction) {
      const updatedTransaction = { ...editingTransaction, ...txData };
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? updatedTransaction : t));
      syncInBackground(() => syncTransactionToSupabase(updatedTransaction), 'el movimiento');
      setEditingTransaction(null);
    } else {
      const newTx: Transaction = {
        ...txData,
        id: createTransactionId(),
        createdAt: new Date().toISOString()
      };
      setTransactions(prev => [newTx, ...prev]);
      syncInBackground(() => syncTransactionToSupabase(newTx), 'el movimiento');
    }
  };

  const handleDuplicateTransaction = (tx: Transaction) => {
    const duplicated: Transaction = {
      ...tx,
      id: createTransactionId(),
      title: `${tx.title} (Copia)`,
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [duplicated, ...prev]);
    syncInBackground(() => syncTransactionToSupabase(duplicated), 'el movimiento duplicado');
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('¿Seguro que deseas borrar este registro?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      syncInBackground(() => deleteTransactionFromSupabase(id), 'la eliminación del movimiento');
    }
  };

  const handleUpdateBudget = (newBudget: MonthlyBudget) => {
    setBudgets(prev => {
      const exists = prev.some(b => b.monthKey === newBudget.monthKey);
      if (exists) {
        return prev.map(b => b.monthKey === newBudget.monthKey ? newBudget : b);
      }
      return [...prev, newBudget];
    });
    syncInBackground(() => syncBudgetToSupabase(newBudget), 'el presupuesto');
  };

  const handleAddCategory = (newCat: Omit<Category, 'id'>) => {
    const created: Category = {
      ...newCat,
      id: `cat-${Date.now()}`
    };
    setCategories(prev => [...prev, created]);
    syncInBackground(() => syncCategoryToSupabase(created), 'la categoría');
  };

  const handleUpdateCategory = (updated: Category) => {
    setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
    syncInBackground(() => syncCategoryToSupabase(updated), 'la categoría');
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('¿Deseas eliminar esta categoría?')) {
      setCategories(prev => prev.filter(c => c.id !== id));
      syncInBackground(() => deleteCategoryFromSupabase(id), 'la eliminación de la categoría');
    }
  };

  const handleCurrencyChange = (sym: string) => {
    const nextSettings = { ...settings, currencySymbol: sym };
    setSettings(nextSettings);
    syncInBackground(() => syncSettingsToSupabase(nextSettings), 'la configuración');
  };

  const handleImportFullData = (imported: {
    transactions: Transaction[];
    categories: Category[];
    budgets: MonthlyBudget[];
    settings: AppSettings;
  }) => {
    setTransactions(imported.transactions);
    setCategories(imported.categories);
    setBudgets(imported.budgets);
    setSettings(imported.settings);
  };

  const handleResetSampleData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setCategories(DEFAULT_CATEGORIES);
    setBudgets(INITIAL_BUDGET.monthKey ? [INITIAL_BUDGET] : []);
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col selection:bg-orange-500 selection:text-black">
      <GlobalGradientDefs />

      <Header
        currentMonthKey={currentMonthKey}
        onMonthChange={setCurrentMonthKey}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewTransaction={() => {
          setEditingTransaction(null);
          setIsFormModalOpen(true);
        }}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        onOpenSupabaseSync={() => setIsSupabaseSyncOpen(true)}
        currencySymbol={settings.currencySymbol}
        onCurrencyChange={handleCurrencyChange}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {(activeTab === 'dashboard' || activeTab === 'transactions') && (
          <SummaryCards
            totalIncome={monthIncome}
            totalExpenses={monthExpenses}
            budgetTarget={currentBudget.totalTarget}
            currencySymbol={settings.currencySymbol}
            onEditBudgetClick={() => setActiveTab('budgets')}
          />
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-6">
                <TransactionList
                  transactions={monthTransactions}
                  categories={categories}
                  currencySymbol={settings.currencySymbol}
                  onEdit={(tx) => {
                    setEditingTransaction(tx);
                    setIsFormModalOpen(true);
                  }}
                  onDuplicate={handleDuplicateTransaction}
                  onDelete={handleDeleteTransaction}
                  onAddNew={() => {
                    setEditingTransaction(null);
                    setIsFormModalOpen(true);
                  }}
                />
              </div>

              <div className="lg:col-span-5 space-y-6">
                <BudgetOverview
                  currentMonthKey={currentMonthKey}
                  monthlyBudget={currentBudget}
                  transactions={monthTransactions}
                  categories={categories}
                  currencySymbol={settings.currencySymbol}
                  onUpdateBudget={handleUpdateBudget}
                />
              </div>
            </div>

            <FinancialIntelligence
              currentMonthKey={currentMonthKey}
              budgetTarget={currentBudget.totalTarget}
              transactions={monthTransactions}
              currencySymbol={settings.currencySymbol}
            />

            <AnalyticsCharts
              transactions={monthTransactions}
              categories={categories}
              currencySymbol={settings.currencySymbol}
            />

            <HistoricalAnalysis
              transactions={transactions}
              currencySymbol={settings.currencySymbol}
            />
          </div>
        )}

        {activeTab === 'transactions' && (
          <TransactionList
            transactions={monthTransactions}
            categories={categories}
            currencySymbol={settings.currencySymbol}
            onEdit={(tx) => {
              setEditingTransaction(tx);
              setIsFormModalOpen(true);
            }}
            onDuplicate={handleDuplicateTransaction}
            onDelete={handleDeleteTransaction}
            onAddNew={() => {
              setEditingTransaction(null);
              setIsFormModalOpen(true);
            }}
          />
        )}

        {activeTab === 'budgets' && (
          <>
            <FinancialIntelligence
              currentMonthKey={currentMonthKey}
              budgetTarget={currentBudget.totalTarget}
              transactions={monthTransactions}
              currencySymbol={settings.currencySymbol}
            />
            <div className="mt-6">
              <BudgetOverview
                currentMonthKey={currentMonthKey}
                monthlyBudget={currentBudget}
                transactions={monthTransactions}
                categories={categories}
                currencySymbol={settings.currencySymbol}
                onUpdateBudget={handleUpdateBudget}
              />
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <>
            <AnalyticsCharts
              transactions={monthTransactions}
              categories={categories}
              currencySymbol={settings.currencySymbol}
            />
            <HistoricalAnalysis
              transactions={transactions}
              currencySymbol={settings.currencySymbol}
            />
          </>
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}
      </main>

      <TransactionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
        categories={categories}
      />

      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        transactions={transactions}
        categories={categories}
        budgets={budgets}
        settings={settings}
        onImportFullData={handleImportFullData}
        onResetSampleData={handleResetSampleData}
      />

      <SupabaseSyncModal
        isOpen={isSupabaseSyncOpen}
        onClose={() => setIsSupabaseSyncOpen(false)}
        transactions={transactions}
        categories={categories}
        budgets={budgets}
        settings={settings}
      />
    </div>
  );
}
