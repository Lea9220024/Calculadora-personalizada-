import React, { useState, useEffect } from 'react';
import { 
  AppProps 
} from 'react';
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
  getInitialBudgets, 
  getInitialTransactions 
} from './data/initialData';
import { Header } from './components/Header';
import { GlobalGradientDefs } from './components/GradientIcon';
import { SummaryCards } from './components/SummaryCards';
import { TransactionList } from './components/TransactionList';
import { BudgetOverview } from './components/BudgetOverview';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { CategoryManager } from './components/CategoryManager';
import { TransactionFormModal } from './components/TransactionFormModal';
import { ExportImportModal } from './components/ExportImportModal';
import { getCurrentMonthKey } from './utils/formatters';

const STORAGE_KEYS = {
  TRANSACTIONS: 'mis_gastos_transactions_v1',
  CATEGORIES: 'mis_gastos_categories_v1',
  BUDGETS: 'mis_gastos_budgets_v1',
  SETTINGS: 'mis_gastos_settings_v1'
};

export default function App() {
  // Current month being viewed
  const [currentMonthKey, setCurrentMonthKey] = useState<string>(getCurrentMonthKey());
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');

  // Core Data state initialized from LocalStorage or Default Sample Data
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return getInitialTransactions();
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
    return getInitialBudgets();
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

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);

  // Sync to LocalStorage
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

  // Filter transactions for currently selected month (YYYY-MM)
  const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonthKey));

  // Current month total income & expenses
  const monthIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Current month budget
  const currentBudget = budgets.find(b => b.monthKey === currentMonthKey) || {
    monthKey: currentMonthKey,
    totalTarget: 1800,
    categoryTargets: {
      vivienda: 900,
      comida: 450,
      servicios: 120,
      transporte: 150
    }
  };

  // Actions
  const handleSaveTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editingTransaction) {
      // Update existing
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? {
        ...t,
        ...txData
      } : t));
      setEditingTransaction(null);
    } else {
      // Create new
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setTransactions(prev => [newTx, ...prev]);
    }
  };

  const handleDuplicateTransaction = (tx: Transaction) => {
    const duplicated: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      title: `${tx.title} (Copia)`,
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [duplicated, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('¿Seguro que deseas borrar este registro?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
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
  };

  // Category CRUD
  const handleAddCategory = (newCat: Omit<Category, 'id'>) => {
    const created: Category = {
      ...newCat,
      id: `cat-${Date.now()}`
    };
    setCategories(prev => [...prev, created]);
  };

  const handleUpdateCategory = (updated: Category) => {
    setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('¿Deseas eliminar esta categoría?')) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  // Full Import / Reset
  const handleImportFullData = (imported: {
    transactions: Transaction[];
    categories: Category[];
    budgets: MonthlyBudget[];
  }) => {
    setTransactions(imported.transactions);
    setCategories(imported.categories);
    setBudgets(imported.budgets);
  };

  const handleResetSampleData = () => {
    setTransactions(getInitialTransactions());
    setCategories(DEFAULT_CATEGORIES);
    setBudgets(getInitialBudgets());
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col selection:bg-orange-500 selection:text-black">
      <GlobalGradientDefs />
      
      {/* App Top Header Navigation */}
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
        currencySymbol={settings.currencySymbol}
        onCurrencyChange={(sym) => setSettings(s => ({ ...s, currencySymbol: sym }))}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Metric Cards - Visible on Dashboard & Transactions tab */}
        {(activeTab === 'dashboard' || activeTab === 'transactions') && (
          <SummaryCards
            totalIncome={monthIncome}
            totalExpenses={monthExpenses}
            budgetTarget={currentBudget.totalTarget}
            currencySymbol={settings.currencySymbol}
            onEditBudgetClick={() => setActiveTab('budgets')}
          />
        )}

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Split view: Transactions on Left, Charts on Right */}
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

            {/* Analytics below */}
            <AnalyticsCharts
              transactions={monthTransactions}
              categories={categories}
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
          <BudgetOverview
            currentMonthKey={currentMonthKey}
            monthlyBudget={currentBudget}
            transactions={monthTransactions}
            categories={categories}
            currencySymbol={settings.currencySymbol}
            onUpdateBudget={handleUpdateBudget}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsCharts
            transactions={monthTransactions}
            categories={categories}
            currencySymbol={settings.currencySymbol}
          />
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

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800 text-zinc-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs space-y-1">
          <p className="font-semibold text-zinc-300">
            Control de Gastos Mensuales — Uso Personal (Pesos Argentinos - ARS)
          </p>
          <p className="text-zinc-500">
            Los datos se guardan de forma privada en tu navegador. Puedes exportar o respaldar en cualquier momento.
          </p>
        </div>
      </footer>

      {/* Add / Edit Transaction Modal */}
      <TransactionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        categories={categories}
        editingTransaction={editingTransaction}
        currentMonthKey={currentMonthKey}
        currencySymbol={settings.currencySymbol}
      />

      {/* Backup & Export Modal */}
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

    </div>
  );
}
