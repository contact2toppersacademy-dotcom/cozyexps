import {
  Category,
  CurrencyCode,
  Loan,
  TrackerData,
  Transaction,
  Wallet,
} from '../types/tracker';

export const STORAGE_KEY = 'cozyledger_appdata_v1';
export const PENDING_SYNC_KEY = 'cozyledger_pending_sync_v1';
export const LAST_SYNC_KEY = 'cozyledger_last_sync_v1';
export const DRIVE_FILE_ID_KEY = 'cozyledger_drive_file_id_v1';
export const LAST_9PM_REMINDER_KEY = 'cozyledger_last_9pm_reminder_v1';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  PKR: 'Rs ',
  USD: '$',
  EUR: '€',
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_salary', name: 'Salary', type: 'income', icon: '💼', updatedAt: 1 },
  { id: 'cat_freelance', name: 'Freelance', type: 'income', icon: '💻', updatedAt: 1 },
  { id: 'cat_business', name: 'Business', type: 'income', icon: '🏪', updatedAt: 1 },
  { id: 'cat_gift', name: 'Gift', type: 'income', icon: '🎁', updatedAt: 1 },
  { id: 'cat_other_inc', name: 'Other Income', type: 'income', icon: '✨', updatedAt: 1 },
  { id: 'cat_food', name: 'Food & Dining', type: 'expense', icon: '🍔', updatedAt: 1 },
  { id: 'cat_grocery', name: 'Groceries', type: 'expense', icon: '🛒', updatedAt: 1 },
  { id: 'cat_transport', name: 'Transport', type: 'expense', icon: '🚕', updatedAt: 1 },
  { id: 'cat_bills', name: 'Bills & Utilities', type: 'expense', icon: '⚡', updatedAt: 1 },
  { id: 'cat_shopping', name: 'Shopping', type: 'expense', icon: '🛍️', updatedAt: 1 },
  { id: 'cat_health', name: 'Health', type: 'expense', icon: '💊', updatedAt: 1 },
  { id: 'cat_home', name: 'Rent & Home', type: 'expense', icon: '🏠', updatedAt: 1 },
  { id: 'cat_fun', name: 'Entertainment', type: 'expense', icon: '🎬', updatedAt: 1 },
  { id: 'cat_other_exp', name: 'Other Expense', type: 'expense', icon: '📦', updatedAt: 1 },
];

export const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'cash',
    name: 'Cash',
    icon: '💵',
    accentBg: 'bg-emerald-500/12 dark:bg-emerald-400/15',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    initialBalance: 0,
    updatedAt: 1,
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    icon: '📱',
    accentBg: 'bg-rose-500/12 dark:bg-rose-400/15',
    accentText: 'text-rose-600 dark:text-rose-400',
    initialBalance: 0,
    updatedAt: 1,
  },
  {
    id: 'easypaisa',
    name: 'Easypaisa',
    icon: '💚',
    accentBg: 'bg-teal-500/12 dark:bg-teal-400/15',
    accentText: 'text-teal-600 dark:text-teal-400',
    initialBalance: 0,
    updatedAt: 1,
  },
  {
    id: 'bank',
    name: 'Bank',
    icon: '🏦',
    accentBg: 'bg-blue-500/12 dark:bg-blue-400/15',
    accentText: 'text-blue-600 dark:text-blue-400',
    initialBalance: 0,
    updatedAt: 1,
  },
];

export function createDefaultData(): TrackerData {
  return {
    version: 1,
    transactions: [],
    loans: [],
    wallets: DEFAULT_WALLETS.map((w) => ({ ...w })),
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    budgets: {
      overallMonthly: 0,
      overallUpdatedAt: 1,
      byCategory: {},
    },
    settings: {
      theme: 'light',
      currency: 'PKR',
      rates: { PKR: 1, USD: 278, EUR: 295 },
      dailyReminder9pm: false,
      budgetAlerts: true,
      backupNotify: true,
      updatedAt: 1,
    },
  };
}

export function uid(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function toBasePKR(amountInDisplay: number, currency: CurrencyCode, rates: Record<CurrencyCode, number>): number {
  const rate = Number(rates[currency]) || 1;
  return Number(amountInDisplay) * rate;
}

export function fromBasePKR(amountPKR: number, currency: CurrencyCode, rates: Record<CurrencyCode, number>): number {
  const rate = Number(rates[currency]) || 1;
  return Number(amountPKR) / rate;
}

export function formatMoney(
  amountPKR: number,
  currency: CurrencyCode,
  rates: Record<CurrencyCode, number>,
  withSign = false
): string {
  const converted = fromBasePKR(amountPKR, currency, rates);
  const abs = Math.abs(converted);
  const sym = CURRENCY_SYMBOLS[currency] || '';
  const decimals = currency === 'PKR' ? (Math.abs(abs - Math.round(abs)) < 0.01 ? 0 : 2) : 2;
  const numStr = abs.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const sign = amountPKR < 0 ? '-' : withSign && amountPKR > 0 ? '+' : '';
  return `${sign}${sym}${numStr}`;
}

export function mergeById<T extends { id: string; updatedAt?: number }>(localArr: T[] = [], remoteArr: T[] = []): T[] {
  const map = new Map<string, T>();
  for (const item of localArr) {
    if (item && item.id) map.set(item.id, item);
  }
  for (const item of remoteArr) {
    if (!item || !item.id) continue;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    } else if ((item.updatedAt || 0) > (existing.updatedAt || 0)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

export function mergeWallets(localWallets: Wallet[] = [], remoteWallets: Wallet[] = []): Wallet[] {
  const map = new Map<string, Wallet>();
  for (const w of DEFAULT_WALLETS) map.set(w.id, { ...w });
  for (const w of localWallets) {
    if (!w || !w.id) continue;
    const prev = map.get(w.id);
    if (!prev || (w.updatedAt || 0) >= (prev.updatedAt || 0)) {
      map.set(w.id, {
        ...prev,
        ...w,
        accentBg: prev?.accentBg || w.accentBg,
        accentText: prev?.accentText || w.accentText,
      });
    }
  }
  for (const w of remoteWallets) {
    if (!w || !w.id) continue;
    const prev = map.get(w.id);
    if (!prev || (w.updatedAt || 0) > (prev.updatedAt || 0)) {
      map.set(w.id, {
        ...prev,
        ...w,
        accentBg: prev?.accentBg || w.accentBg,
        accentText: prev?.accentText || w.accentText,
      });
    }
  }
  return Array.from(map.values());
}

export function mergeTrackerData(local: TrackerData, remote: Partial<TrackerData> | null | undefined): TrackerData {
  if (!remote || typeof remote !== 'object') return local;

  const mergedCatBudgets = { ...(local.budgets?.byCategory || {}) };
  const remoteCatBudgets = remote.budgets?.byCategory || {};
  for (const [catId, val] of Object.entries(remoteCatBudgets)) {
    if (!val) continue;
    if (!mergedCatBudgets[catId] || (val.updatedAt || 0) > (mergedCatBudgets[catId].updatedAt || 0)) {
      mergedCatBudgets[catId] = val;
    }
  }

  const useRemoteOverall = (remote.budgets?.overallUpdatedAt || 0) > (local.budgets?.overallUpdatedAt || 0);
  const useRemoteSettings = (remote.settings?.updatedAt || 0) > (local.settings?.updatedAt || 0);

  return {
    version: 1,
    transactions: mergeById<Transaction>(local.transactions, remote.transactions || []),
    loans: mergeById<Loan>(local.loans, remote.loans || []),
    wallets: mergeWallets(local.wallets, remote.wallets || []),
    categories: mergeById<Category>(local.categories, remote.categories || []),
    budgets: {
      overallMonthly: useRemoteOverall ? remote.budgets?.overallMonthly || 0 : local.budgets?.overallMonthly || 0,
      overallUpdatedAt: Math.max(local.budgets?.overallUpdatedAt || 0, remote.budgets?.overallUpdatedAt || 0),
      byCategory: mergedCatBudgets,
    },
    settings: useRemoteSettings
      ? {
          ...local.settings,
          ...remote.settings,
          rates: { ...local.settings.rates, ...(remote.settings?.rates || {}) },
        }
      : {
          ...remote.settings,
          ...local.settings,
          rates: { ...(remote.settings?.rates || {}), ...local.settings.rates },
        },
  };
}

export function loadLocalTrackerData(): TrackerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    const parsed = JSON.parse(raw) as Partial<TrackerData>;
    return mergeTrackerData(createDefaultData(), parsed);
  } catch {
    return createDefaultData();
  }
}

export function saveLocalTrackerData(data: TrackerData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getWalletBalances(data: TrackerData): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const w of data.wallets) {
    balances[w.id] = Number(w.initialBalance || 0);
  }
  for (const tx of data.transactions) {
    if (tx.deleted || balances[tx.walletId] === undefined) continue;
    if (tx.type === 'income') balances[tx.walletId] += Number(tx.amount);
    else balances[tx.walletId] -= Number(tx.amount);
  }
  for (const loan of data.loans) {
    if (loan.deleted || !loan.affectWallet) continue;
    if (balances[loan.walletId] !== undefined) {
      if (loan.type === 'lent') balances[loan.walletId] -= Number(loan.amount);
      else balances[loan.walletId] += Number(loan.amount);
    }
    for (const rep of loan.repayments || []) {
      const rWallet = rep.walletId || loan.walletId;
      if (balances[rWallet] === undefined) continue;
      if (loan.type === 'lent') balances[rWallet] += Number(rep.amount);
      else balances[rWallet] -= Number(rep.amount);
    }
  }
  return balances;
}
