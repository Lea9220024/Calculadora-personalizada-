import { AppSettings, Category, FinancialCard, FutureCommitment, InstallmentPlan, MonthlyBudget, NetWorthSnapshot, PatrimonyItem, Subscription, Transaction } from '../types';

export const BACKUP_VERSION = '2.0';
export const SAFETY_BACKUP_KEY = 'cream_safety_backup_v2';

export interface CreamBackup {
  app: 'C.R.E.A.M.';
  exportDate: string;
  version: string;
  transactions: Transaction[];
  categories: Category[];
  budgets: MonthlyBudget[];
  settings: AppSettings;
  cards: FinancialCard[];
  installmentPlans: InstallmentPlan[];
  subscriptions: Subscription[];
  patrimonyItems: PatrimonyItem[];
  netWorthSnapshots: NetWorthSnapshot[];
  futureCommitments: FutureCommitment[];
}

const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object';

const isSettings = (value: unknown): value is AppSettings => {
  if (!isObject(value)) return false;
  return typeof value.currencySymbol === 'string' &&
    typeof value.currencyCode === 'string' &&
    (value.theme === 'light' || value.theme === 'dark' || value.theme === 'system') &&
    typeof value.startDayOfMonth === 'number' &&
    Number.isInteger(value.startDayOfMonth) &&
    value.startDayOfMonth >= 1 && value.startDayOfMonth <= 31;
};

export const isValidBackup = (value: unknown): value is Partial<CreamBackup> & { transactions: Transaction[] } => {
  if (!isObject(value) || !Array.isArray(value.transactions)) return false;
  const arrayFields = ['categories','budgets','cards','installmentPlans','subscriptions','patrimonyItems','netWorthSnapshots','futureCommitments'];
  if (value.settings !== undefined && !isSettings(value.settings)) return false;
  return arrayFields.every(field => value[field] === undefined || Array.isArray(value[field]));
};

export const createBackup = (data: Omit<CreamBackup, 'app' | 'exportDate' | 'version'>): CreamBackup => ({
  app: 'C.R.E.A.M.',
  exportDate: new Date().toISOString(),
  version: BACKUP_VERSION,
  ...data,
});

export const saveSafetyBackup = (backup: CreamBackup): boolean => {
  try {
    localStorage.setItem(SAFETY_BACKUP_KEY, JSON.stringify(backup));
    return true;
  } catch (error) {
    console.error('No se pudo guardar el respaldo de seguridad local.', error);
    return false;
  }
};

export const loadSafetyBackup = (): CreamBackup | null => {
  try {
    const raw = localStorage.getItem(SAFETY_BACKUP_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidBackup(parsed) && parsed.categories && parsed.budgets && parsed.settings &&
      parsed.cards && parsed.installmentPlans && parsed.subscriptions && parsed.patrimonyItems &&
      parsed.netWorthSnapshots && parsed.futureCommitments
      ? parsed as CreamBackup
      : null;
  } catch {
    return null;
  }
};
