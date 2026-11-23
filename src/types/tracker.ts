export type CurrencyCode = 'PKR' | 'USD' | 'EUR';
export type ThemeMode = 'light' | 'dark';
export type TransactionType = 'income' | 'expense';
export type LoanType = 'lent' | 'borrowed';
export type SyncStatus = 'synced' | 'syncing' | 'unsynced';
export type TxFilterType = '7days' | 'all' | 'income' | 'expense' | 'date';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // Stored in base PKR
  title: string;
  categoryId: string;
  walletId: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
}

export interface Repayment {
  id: string;
  amount: number; // Stored in base PKR
  walletId: string;
  date: string;
}

export interface Loan {
  id: string;
  type: LoanType;
  person: string;
  amount: number; // Stored in base PKR
  walletId: string;
  dueDate?: string;
  affectWallet: boolean;
  repayments: Repayment[];
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
}

export interface Wallet {
  id: string;
  name: string;
  icon: string;
  accentBg: string;
  accentText: string;
  initialBalance: number; // Stored in base PKR
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  updatedAt: number;
  deleted?: boolean;
}

export interface CategoryBudget {
  limit: number; // Stored in base PKR
  updatedAt: number;
}

export interface BudgetConfig {
  overallMonthly: number; // Stored in base PKR
  overallUpdatedAt: number;
  byCategory: Record<string, CategoryBudget>;
}

export interface AppSettings {
  theme: ThemeMode;
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>; // PKR per 1 unit
  dailyReminder9pm: boolean;
  budgetAlerts: boolean;
  backupNotify: boolean;
  updatedAt: number;
}

export interface TrackerData {
  version: number;
  transactions: Transaction[];
  loans: Loan[];
  wallets: Wallet[];
  categories: Category[];
  budgets: BudgetConfig;
  settings: AppSettings;
}

export interface ConfirmState {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}
