import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ReceiptText, Search, X } from 'lucide-react';
import { ActionGrid } from './components/ActionGrid';
import { BalanceCard } from './components/BalanceCard';
import { BudgetsModal } from './components/BudgetsModal';
import { CategoriesModal } from './components/CategoriesModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DrawerMenu } from './components/DrawerMenu';
import { Header } from './components/Header';
import { LoansModal } from './components/LoansModal';
import { OptionsModal } from './components/OptionsModal';
import { ProfileSyncModal } from './components/ProfileSyncModal';
import { TransactionModal } from './components/TransactionModal';
import { TransactionReceiptModal } from './components/TransactionReceiptModal';
import { TransactionsCard } from './components/TransactionsCard';
import { WalletGrid } from './components/WalletGrid';
import { WalletsModal } from './components/WalletsModal';
import { DriveSyncError, syncWithGoogleDrive } from './services/driveSync';
import {
  clearCachedToken,
  getAccessToken,
  GoogleUserProfile,
  initAuth,
  loadSavedUserProfile,
  signInWithGoogle,
  signOutGoogle,
} from './services/googleAuth';
import {
  Category,
  ConfirmState,
  CurrencyCode,
  Loan,
  LoanType,
  SyncStatus,
  TrackerData,
  Transaction,
  TransactionType,
  TxFilterType,
} from './types/tracker';
import {
  DRIVE_FILE_ID_KEY,
  formatMoney,
  getWalletBalances,
  LAST_9PM_REMINDER_KEY,
  LAST_SYNC_KEY,
  loadLocalTrackerData,
  mergeTrackerData,
  PENDING_SYNC_KEY,
  saveLocalTrackerData,
  todayStr,
  uid,
} from './utils/trackerData';

type ActiveModal =
  | null
  | 'tx'
  | 'wallets'
  | 'loans'
  | 'budgets'
  | 'categories'
  | 'options'
  | 'profile';

interface ToastItem {
  id: string;
  text: string;
  receiptTx?: Transaction;
}

const ONBOARDING_SEEN_KEY = 'cozyledger_onboarding_seen_v1';

export default function App() {
  const [data, setData] = useState<TrackerData>(() => loadLocalTrackerData());
  const latestDataRef = useRef<TrackerData>(data);
  latestDataRef.current = data;

  const [year, setYear] = useState<string>(() => String(new Date().getFullYear()));
  const [txFilter, setTxFilter] = useState<TxFilterType>('7days');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(() => {
    const savedUser = loadSavedUserProfile();
    const seen = localStorage.getItem(ONBOARDING_SEEN_KEY) === '1';
    return !savedUser && !seen ? 'profile' : null;
  });
  const [isFirstTimePrompt, setIsFirstTimePrompt] = useState<boolean>(() => {
    const savedUser = loadSavedUserProfile();
    const seen = localStorage.getItem(ONBOARDING_SEEN_KEY) === '1';
    return !savedUser && !seen;
  });

  const [txModalType, setTxModalType] = useState<TransactionType>('expense');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [viewingReceiptTx, setViewingReceiptTx] = useState<Transaction | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const [user, setUser] = useState<GoogleUserProfile | null>(() => loadSavedUserProfile());
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('unsynced');
  const [syncError, setSyncError] = useState<string>(() => {
    const saved = loadSavedUserProfile();
    if (!navigator.onLine) return 'Offline — changes saved locally.';
    return saved
      ? 'Tap red dot or Reconnect & Sync to authorize this browser session.'
      : 'Sign in with Google to use your Google Drive as personal storage.';
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(
    () => localStorage.getItem(LAST_SYNC_KEY) || ''
  );

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const debounceRef = useRef<number | null>(null);
  const syncInFlightRef = useRef<boolean>(false);

  const showToast = useCallback((text: string, receiptTx?: Transaction) => {
    const id = uid('toast');
    setToasts((prev) => [...prev, { id, text, receiptTx }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch {
        // Ignore notification errors in restricted contexts
      }
    }
  }, []);

  // Apply light/dark theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (data.settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [data.settings.theme]);

  // Core Google Drive sync runner (uses signed-in user's own Drive appDataFolder)
  const performSync = useCallback(
    async (
      snapshot?: TrackerData,
      options: {
        isLogin?: boolean;
        manual?: boolean;
        tokenOverride?: string;
        userEmailOverride?: string;
      } = {}
    ) => {
      if (syncInFlightRef.current) return;

      if (!navigator.onLine) {
        setSyncStatus('unsynced');
        setSyncError('Device is offline. Changes are saved locally and will auto-sync when online.');
        return;
      }

      const token = options.tokenOverride || getAccessToken();
      const activeEmail = options.userEmailOverride || user?.email;
      if (!token) {
        setSyncStatus('unsynced');
        setSyncError(
          user
            ? 'Google Drive session expired. Tap Reconnect & Sync to continue.'
            : 'Sign in with Google to sync with your Google Drive appDataFolder.'
        );
        return;
      }

      syncInFlightRef.current = true;
      setSyncStatus('syncing');
      setSyncError('');

      try {
        const source = snapshot || latestDataRef.current;
        const { mergedData, hadRemote } = await syncWithGoogleDrive(
          source,
          token,
          activeEmail
        );

        const finalMerged = mergeTrackerData(latestDataRef.current, mergedData);
        saveLocalTrackerData(finalMerged);
        setData(finalMerged);

        localStorage.setItem(PENDING_SYNC_KEY, '0');
        const stamp = new Date().toLocaleString();
        localStorage.setItem(LAST_SYNC_KEY, stamp);
        setLastSyncedAt(stamp);
        setSyncStatus('synced');
        setSyncError('');

        if (finalMerged.settings.backupNotify || options.manual || options.isLogin) {
          const msg = options.isLogin
            ? hadRemote
              ? 'Restored & merged from your Google Drive'
              : 'Account created & connected to your Google Drive'
            : 'Backup Done — Google Drive synced';
          showToast(msg);
          sendBrowserNotification('CozyLedger Backup Done', msg);
        }
      } catch (err) {
        if (err instanceof DriveSyncError && err.status === 401) {
          clearCachedToken();
          setSyncStatus('unsynced');
          setSyncError('Google authorization expired (401). Tap red dot to reconnect & retry.');
        } else {
          setSyncStatus('unsynced');
          setSyncError(
            err instanceof Error ? err.message : 'Failed to sync with Google Drive.'
          );
        }
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [sendBrowserNotification, showToast, user]
  );

  const scheduleDebouncedSync = useCallback(
    (nextData: TrackerData) => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }

      if (!navigator.onLine) {
        setSyncStatus('unsynced');
        setSyncError('Offline — saved locally and queued for auto-sync.');
        return;
      }

      if (!getAccessToken()) {
        setSyncStatus('unsynced');
        setSyncError(
          user
            ? 'Session refresh needed — tap red dot to reconnect & sync.'
            : 'Not signed in to Google Drive. Data saved locally.'
        );
        return;
      }

      setSyncStatus('syncing');
      debounceRef.current = window.setTimeout(() => {
        performSync(nextData);
      }, 2000);
    },
    [performSync, user]
  );

  // Centralized state mutator: saves locally + queues 2s debounced Drive sync
  const updateData = useCallback(
    (updater: (prev: TrackerData) => TrackerData) => {
      setData((prev) => {
        const next = updater(prev);
        saveLocalTrackerData(next);
        localStorage.setItem(PENDING_SYNC_KEY, '1');
        scheduleDebouncedSync(next);
        return next;
      });
    },
    [scheduleDebouncedSync]
  );

  // Auth listener
  useEffect(() => {
    const unsub = initAuth((authUser, token) => {
      setUser(authUser);
      if (authUser) {
        localStorage.setItem(ONBOARDING_SEEN_KEY, '1');
        setIsFirstTimePrompt(false);
      }
      if (!authUser) {
        setSyncStatus('unsynced');
        setSyncError('Not signed in to Google Drive.');
      } else if (!token) {
        setSyncStatus('unsynced');
        setSyncError('Tap red dot or Reconnect & Sync to authorize this browser session.');
      } else if (navigator.onLine) {
        performSync(latestDataRef.current, {
          tokenOverride: token,
          userEmailOverride: authUser.email,
        });
      }
    });
    return () => unsub();
  }, [performSync]);

  // Online / Offline listeners for automatic sync when reconnecting
  useEffect(() => {
    const handleOnline = () => {
      const token = getAccessToken();
      const pending = localStorage.getItem(PENDING_SYNC_KEY) === '1';
      if (token && (pending || syncStatus === 'unsynced')) {
        performSync(latestDataRef.current);
      } else if (user && !token) {
        setSyncStatus('unsynced');
        setSyncError('Back online. Tap red dot to reconnect Google Drive & sync.');
      }
    };

    const handleOffline = () => {
      setSyncStatus('unsynced');
      setSyncError('Offline — changes are saved locally and will auto-sync when online.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [performSync, syncStatus, user]);

  // Daily 9:00 PM Reminder watcher
  useEffect(() => {
    const checkReminder = () => {
      if (!latestDataRef.current.settings.dailyReminder9pm) return;
      const now = new Date();
      if (now.getHours() >= 21) {
        const today = todayStr();
        const last = localStorage.getItem(LAST_9PM_REMINDER_KEY);
        if (last !== today) {
          localStorage.setItem(LAST_9PM_REMINDER_KEY, today);
          showToast('9:00 PM Reminder: Time to log today’s income & expenses!');
          sendBrowserNotification(
            'CozyLedger Daily Reminder',
            'It is 9:00 PM! Take a moment to record today’s expenses.'
          );
        }
      }
    };

    checkReminder();
    const timer = window.setInterval(checkReminder, 30000);
    return () => window.clearInterval(timer);
  }, [sendBrowserNotification, showToast]);

  // Auth actions
  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setSyncError('');
    try {
      const res = await signInWithGoogle();
      localStorage.setItem(ONBOARDING_SEEN_KEY, '1');
      setIsFirstTimePrompt(false);
      setUser(res.user);
      setActiveModal(null);
      await performSync(latestDataRef.current, {
        isLogin: true,
        tokenOverride: res.accessToken,
        userEmailOverride: res.user.email,
      });
    } catch (err) {
      setSyncStatus('unsynced');
      setSyncError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDismissOnboarding = () => {
    localStorage.setItem(ONBOARDING_SEEN_KEY, '1');
    setIsFirstTimePrompt(false);
    setActiveModal(null);
  };

  const handleSignOut = () => {
    const hasPending = localStorage.getItem(PENDING_SYNC_KEY) === '1';
    const doLogout = async () => {
      const email = user?.email;
      await signOutGoogle();
      if (email) {
        localStorage.removeItem(`${DRIVE_FILE_ID_KEY}_${email}`);
      }
      localStorage.removeItem(DRIVE_FILE_ID_KEY);
      setUser(null);
      setSyncStatus('unsynced');
      setSyncError('Signed out of Google Drive.');
      showToast('Signed out');
    };

    if (hasPending) {
      setConfirmState({
        title: 'Unsynced changes pending',
        message:
          'You have local changes that have not synced to Google Drive yet. Your data will stay saved on this device, but will not sync until you sign back in.',
        confirmLabel: 'Sign Out',
        danger: true,
        onConfirm: doLogout,
      });
    } else {
      doLogout();
    }
  };

  // Sync dot tap handler: Green = Auto-backup now; Red = Retry sync + show error
  const handleSyncDotClick = () => {
    if (syncStatus === 'syncing') {
      showToast('Syncing with your Google Drive...');
      return;
    }
    if (syncStatus === 'synced') {
      if (navigator.onLine && getAccessToken()) {
        performSync(latestDataRef.current, { manual: true });
      } else if (navigator.onLine && user) {
        handleSignIn();
      } else {
        setIsFirstTimePrompt(false);
        setActiveModal('profile');
      }
      return;
    }
    // Red dot (unsynced): show error + retry sync
    setIsFirstTimePrompt(false);
    setActiveModal('profile');
    if (navigator.onLine && getAccessToken()) {
      performSync(latestDataRef.current, { manual: true });
    } else if (navigator.onLine && user && !getAccessToken()) {
      handleSignIn();
    }
  };

  // Derived Financial Calculations
  const activeTransactions = useMemo(
    () => data.transactions.filter((t) => !t.deleted),
    [data.transactions]
  );

  const availableYears = useMemo(() => {
    const curYear = String(new Date().getFullYear());
    const set = new Set<string>([curYear]);
    for (const tx of activeTransactions) {
      if (tx.date && tx.date.length >= 4) {
        set.add(tx.date.slice(0, 4));
      }
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [activeTransactions]);

  const walletBalances = useMemo(() => getWalletBalances(data), [data]);

  const totalBalancePKR = useMemo(
    () => Object.values(walletBalances).reduce((sum, val) => sum + val, 0),
    [walletBalances]
  );

  const { incomePKR, expensePKR } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of activeTransactions) {
      if (year !== 'all' && !tx.date.startsWith(year)) continue;
      if (tx.type === 'income') inc += Number(tx.amount);
      else exp += Number(tx.amount);
    }
    return { incomePKR: inc, expensePKR: exp };
  }, [activeTransactions, year]);

  const filteredTransactions = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const catMap = new Map(data.categories.map((c) => [c.id, c.name.toLowerCase()]));
    const walMap = new Map(data.wallets.map((w) => [w.id, w.name.toLowerCase()]));
    const q = searchQuery.trim().toLowerCase();

    return activeTransactions
      .filter((tx) => {
        if (year !== 'all' && !tx.date.startsWith(year)) return false;

        if (txFilter === '7days') {
          const [y, m, d] = tx.date.split('-').map(Number);
          const dt = new Date(y, m - 1, d, 12, 0, 0);
          if (dt < sevenDaysAgo || dt > today) return false;
        } else if (txFilter === 'income' && tx.type !== 'income') {
          return false;
        } else if (txFilter === 'expense' && tx.type !== 'expense') {
          return false;
        } else if (txFilter === 'date' && selectedDate && tx.date !== selectedDate) {
          return false;
        }

        if (q) {
          const catName = catMap.get(tx.categoryId) || '';
          const walName = walMap.get(tx.walletId) || '';
          const match =
            tx.title.toLowerCase().includes(q) ||
            (tx.note || '').toLowerCase().includes(q) ||
            catName.includes(q) ||
            walName.includes(q) ||
            String(tx.amount).includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [activeTransactions, data.categories, data.wallets, searchQuery, selectedDate, txFilter, year]);

  const budgetBanner = useMemo(() => {
    if (!data.settings.budgetAlerts) return null;
    const curMonth = todayStr().slice(0, 7);
    const monthExp = activeTransactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(curMonth)
    );
    const totalSpent = monthExp.reduce((s, t) => s + Number(t.amount), 0);

    const overallLimit = Number(data.budgets.overallMonthly || 0);
    if (overallLimit > 0) {
      const pct = (totalSpent / overallLimit) * 100;
      if (pct >= 100) {
        return {
          danger: true,
          text: `Monthly budget exceeded (${Math.round(pct)}%)`,
        };
      }
      if (pct >= 80) {
        return {
          danger: false,
          text: `Monthly budget at ${Math.round(pct)}% (${formatMoney(
            totalSpent,
            data.settings.currency,
            data.settings.rates
          )} / ${formatMoney(overallLimit, data.settings.currency, data.settings.rates)})`,
        };
      }
    }

    for (const [catId, cfg] of Object.entries(data.budgets.byCategory || {})) {
      if (!cfg?.limit) continue;
      const spent = monthExp
        .filter((t) => t.categoryId === catId)
        .reduce((s, t) => s + Number(t.amount), 0);
      const pct = (spent / cfg.limit) * 100;
      if (pct >= 80) {
        const cat = data.categories.find((c) => c.id === catId);
        return {
          danger: pct >= 100,
          text: `${cat?.name || 'Category'} budget at ${Math.round(pct)}%`,
        };
      }
    }
    return null;
  }, [
    activeTransactions,
    data.budgets,
    data.categories,
    data.settings.budgetAlerts,
    data.settings.currency,
    data.settings.rates,
  ]);

  // Handlers
  const handleYearChange = (nextYear: string) => {
    setYear(nextYear);
    const curYear = String(new Date().getFullYear());
    if (nextYear !== curYear && txFilter === '7days') {
      setTxFilter('all');
    }
  };

  const handleSaveTransaction = (
    payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    const now = Date.now();
    let createdOrUpdatedTx: Transaction | null = null;

    updateData((prev) => {
      if (payload.id) {
        const updatedList = prev.transactions.map((t) => {
          if (t.id === payload.id) {
            createdOrUpdatedTx = { ...t, ...payload, id: t.id, updatedAt: now, deleted: false };
            return createdOrUpdatedTx;
          }
          return t;
        });
        return { ...prev, transactions: updatedList };
      }

      const newTx: Transaction = {
        ...payload,
        id: uid('tx'),
        createdAt: now,
        updatedAt: now,
        deleted: false,
      };
      createdOrUpdatedTx = newTx;
      return {
        ...prev,
        transactions: [...prev.transactions, newTx],
      };
    });

    if (createdOrUpdatedTx) {
      showToast(
        payload.id ? 'Transaction updated' : 'Transaction saved',
        createdOrUpdatedTx
      );
    }

    if (payload.type === 'expense' && data.settings.budgetAlerts) {
      const curMonth = todayStr().slice(0, 7);
      if (payload.date.startsWith(curMonth)) {
        const existingOther = activeTransactions
          .filter((t) => t.id !== payload.id && t.type === 'expense' && t.date.startsWith(curMonth))
          .reduce((s, t) => s + Number(t.amount), 0);
        const projected = existingOther + payload.amount;
        const limit = Number(data.budgets.overallMonthly || 0);
        if (limit > 0 && projected >= limit * 0.8) {
          const msg =
            projected >= limit
              ? 'Budget Alert: Monthly spending limit exceeded!'
              : 'Budget Alert: Reached 80%+ of monthly limit';
          showToast(msg);
          sendBrowserNotification('CozyLedger Budget Alert', msg);
        }
      }
    }
  };

  const handleRequestDeleteTx = (tx: Transaction) => {
    setConfirmState({
      title: 'Delete Transaction?',
      message: `Remove "${tx.title}" (${formatMoney(
        tx.amount,
        data.settings.currency,
        data.settings.rates
      )})? This change will also sync to your Google Drive backup.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        const now = Date.now();
        updateData((prev) => ({
          ...prev,
          transactions: prev.transactions.map((t) =>
            t.id === tx.id ? { ...t, deleted: true, updatedAt: now } : t
          ),
        }));
        showToast('Transaction deleted');
      },
    });
  };

  const handleAdjustWallet = (walletId: string, newBalancePKR: number) => {
    const currentBal = walletBalances[walletId] || 0;
    const diff = newBalancePKR - currentBal;
    const now = Date.now();
    updateData((prev) => ({
      ...prev,
      wallets: prev.wallets.map((w) =>
        w.id === walletId
          ? { ...w, initialBalance: Number(w.initialBalance || 0) + diff, updatedAt: now }
          : w
      ),
    }));
    showToast('Wallet balance updated');
  };

  const handleTransferWallet = (fromId: string, toId: string, amountPKR: number) => {
    const now = Date.now();
    updateData((prev) => ({
      ...prev,
      wallets: prev.wallets.map((w) => {
        if (w.id === fromId) {
          return { ...w, initialBalance: Number(w.initialBalance || 0) - amountPKR, updatedAt: now };
        }
        if (w.id === toId) {
          return { ...w, initialBalance: Number(w.initialBalance || 0) + amountPKR, updatedAt: now };
        }
        return w;
      }),
    }));
    showToast(
      `Transferred ${formatMoney(amountPKR, data.settings.currency, data.settings.rates)}`
    );
  };

  const handleAddLoan = (loan: {
    type: LoanType;
    person: string;
    amountPKR: number;
    walletId: string;
    dueDate?: string;
    affectWallet: boolean;
  }) => {
    const now = Date.now();
    const newLoan: Loan = {
      id: uid('loan'),
      type: loan.type,
      person: loan.person,
      amount: loan.amountPKR,
      walletId: loan.walletId,
      dueDate: loan.dueDate,
      affectWallet: loan.affectWallet,
      repayments: [],
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    updateData((prev) => ({
      ...prev,
      loans: [...prev.loans, newLoan],
    }));
    showToast('Loan record saved');
  };

  const handleRepayLoan = (loanId: string, amountPKR: number) => {
    const now = Date.now();
    updateData((prev) => ({
      ...prev,
      loans: prev.loans.map((l) =>
        l.id === loanId
          ? {
              ...l,
              repayments: [
                ...(l.repayments || []),
                {
                  id: uid('rep'),
                  amount: amountPKR,
                  walletId: l.walletId,
                  date: todayStr(),
                },
              ],
              updatedAt: now,
            }
          : l
      ),
    }));
    showToast('Loan payment recorded');
  };

  const handleRequestDeleteLoan = (loan: Loan) => {
    setConfirmState({
      title: 'Delete Loan Record?',
      message: `Delete loan record for "${loan.person}"? This change will also sync to Google Drive.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        const now = Date.now();
        updateData((prev) => ({
          ...prev,
          loans: prev.loans.map((l) =>
            l.id === loan.id ? { ...l, deleted: true, updatedAt: now } : l
          ),
        }));
        showToast('Loan deleted');
      },
    });
  };

  const handleAddCategory = (name: string, type: TransactionType, icon: string) => {
    const newCat: Category = {
      id: uid('cat'),
      name,
      type,
      icon,
      updatedAt: Date.now(),
      deleted: false,
    };
    updateData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));
    showToast('Category added');
  };

  const handleRequestDeleteCategory = (cat: Category) => {
    setConfirmState({
      title: 'Remove Category?',
      message: `Remove "${cat.name}" from your category list? Existing transactions keep their amounts.`,
      confirmLabel: 'Remove',
      danger: true,
      onConfirm: () => {
        const now = Date.now();
        updateData((prev) => ({
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === cat.id ? { ...c, deleted: true, updatedAt: now } : c
          ),
        }));
        showToast('Category removed');
      },
    });
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_tracker_${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON exported');
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result)) as Partial<TrackerData>;
        updateData((prev) => mergeTrackerData(prev, imported));
        showToast('Backup merged by ID!');
      } catch {
        showToast('Invalid JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#f4f6fa] dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors duration-200 pb-8">
        <Header
          year={year}
          availableYears={availableYears}
          onYearChange={handleYearChange}
          searchOpen={searchOpen}
          onToggleSearch={() => setSearchOpen((v) => !v)}
          theme={data.settings.theme}
          onToggleTheme={() =>
            updateData((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                theme: prev.settings.theme === 'dark' ? 'light' : 'dark',
                updatedAt: Date.now(),
              },
            }))
          }
          currency={data.settings.currency}
          onCurrencyChange={(currency: CurrencyCode) =>
            updateData((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                currency,
                updatedAt: Date.now(),
              },
            }))
          }
          userPicture={user?.picture}
          userName={user?.name}
          syncStatus={syncStatus}
          onOpenMenu={() => setDrawerOpen(true)}
          onOpenProfile={() => {
            setIsFirstTimePrompt(false);
            setActiveModal('profile');
          }}
          onSyncDotClick={handleSyncDotClick}
        />

        {/* Animated Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="max-w-5xl mx-auto px-3 sm:px-5 pt-2.5">
                <div className="flex items-center gap-2 rounded-[16px] bg-white dark:bg-[#131c31] border border-slate-900/6 dark:border-white/8 px-3.5 py-2.5 shadow-sm">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, category, wallet, note..."
                    className="w-full bg-transparent text-sm font-medium focus:outline-none placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Dashboard */}
        <main className="max-w-5xl mx-auto px-3 sm:px-5 pt-3.5 space-y-3.5">
          <AnimatePresence>
            {budgetBanner && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`rounded-[16px] px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-bold border ${
                  budgetBanner.danger
                    ? 'bg-rose-500/12 border-rose-500/25 text-rose-700 dark:text-rose-300'
                    : 'bg-amber-500/12 border-amber-500/25 text-amber-700 dark:text-amber-300'
                }`}
              >
                <span>{budgetBanner.text}</span>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveModal('budgets')}
                  className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-[#131c31]/80 text-slate-800 dark:text-slate-100 shrink-0"
                >
                  Budgets
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-5 items-start">
            {/* Left / Top column: Balance Card + Wallets + 4-Action Grid */}
            <div className="lg:col-span-5 space-y-3.5">
              <BalanceCard
                totalBalancePKR={totalBalancePKR}
                incomePKR={incomePKR}
                expensePKR={expensePKR}
                year={year}
                currency={data.settings.currency}
                rates={data.settings.rates}
              />

              <WalletGrid
                wallets={data.wallets}
                balances={walletBalances}
                currency={data.settings.currency}
                rates={data.settings.rates}
                onSelectWallet={() => setActiveModal('wallets')}
              />

              <ActionGrid
                onAddIncome={() => {
                  setEditingTx(null);
                  setTxModalType('income');
                  setActiveModal('tx');
                }}
                onAddExpense={() => {
                  setEditingTx(null);
                  setTxModalType('expense');
                  setActiveModal('tx');
                }}
                onOpenLoan={() => setActiveModal('loans')}
                onOpenOptions={() => setActiveModal('options')}
              />
            </div>

            {/* Right / Bottom column: Recent Transactions */}
            <div className="lg:col-span-7">
              <TransactionsCard
                transactions={filteredTransactions}
                categories={data.categories}
                wallets={data.wallets}
                currency={data.settings.currency}
                rates={data.settings.rates}
                filter={txFilter}
                selectedDate={selectedDate}
                onFilterChange={setTxFilter}
                onDateChange={(d) => {
                  setSelectedDate(d);
                  setTxFilter('date');
                }}
                onSelectTransaction={(tx) => setViewingReceiptTx(tx)}
              />
            </div>
          </div>
        </main>

        {/* Navigation Drawer */}
        <DrawerMenu
          open={drawerOpen}
          userSubtitle={user?.email || user?.name || 'Offline Ready (Local)'}
          onClose={() => setDrawerOpen(false)}
          onAddIncome={() => {
            setEditingTx(null);
            setTxModalType('income');
            setActiveModal('tx');
          }}
          onAddExpense={() => {
            setEditingTx(null);
            setTxModalType('expense');
            setActiveModal('tx');
          }}
          onOpenWallets={() => setActiveModal('wallets')}
          onOpenLoans={() => setActiveModal('loans')}
          onOpenBudgets={() => setActiveModal('budgets')}
          onOpenCategories={() => setActiveModal('categories')}
          onOpenOptions={() => setActiveModal('options')}
          onOpenProfile={() => {
            setIsFirstTimePrompt(false);
            setActiveModal('profile');
          }}
        />

        {/* Transaction Receipt View Modal */}
        <TransactionReceiptModal
          transaction={viewingReceiptTx}
          categories={data.categories}
          wallets={data.wallets}
          currency={data.settings.currency}
          rates={data.settings.rates}
          onClose={() => setViewingReceiptTx(null)}
          onEdit={(tx) => {
            setEditingTx(tx);
            setTxModalType(tx.type);
            setActiveModal('tx');
          }}
          onRequestDelete={handleRequestDeleteTx}
          onToast={(msg) => showToast(msg)}
        />

        {/* Modals */}
        <TransactionModal
          open={activeModal === 'tx'}
          initialType={txModalType}
          editingTx={editingTx}
          categories={data.categories}
          wallets={data.wallets}
          currency={data.settings.currency}
          rates={data.settings.rates}
          onClose={() => setActiveModal(null)}
          onSave={handleSaveTransaction}
          onRequestDelete={handleRequestDeleteTx}
        />

        <WalletsModal
          open={activeModal === 'wallets'}
          wallets={data.wallets}
          balances={walletBalances}
          currency={data.settings.currency}
          rates={data.settings.rates}
          onClose={() => setActiveModal(null)}
          onAdjustWallet={handleAdjustWallet}
          onTransfer={handleTransferWallet}
        />

        <LoansModal
          open={activeModal === 'loans'}
          loans={data.loans}
          wallets={data.wallets}
          currency={data.settings.currency}
          rates={data.settings.rates}
          onClose={() => setActiveModal(null)}
          onAddLoan={handleAddLoan}
          onRepayLoan={handleRepayLoan}
          onRequestDeleteLoan={handleRequestDeleteLoan}
        />

        <BudgetsModal
          open={activeModal === 'budgets'}
          budgets={data.budgets}
          categories={data.categories}
          transactions={data.transactions}
          currency={data.settings.currency}
          rates={data.settings.rates}
          onClose={() => setActiveModal(null)}
          onSaveOverallBudget={(limitPKR) => {
            updateData((prev) => ({
              ...prev,
              budgets: {
                ...prev.budgets,
                overallMonthly: limitPKR,
                overallUpdatedAt: Date.now(),
              },
            }));
            showToast('Monthly budget saved');
          }}
          onSaveCategoryBudget={(categoryId, limitPKR) => {
            updateData((prev) => ({
              ...prev,
              budgets: {
                ...prev.budgets,
                byCategory: {
                  ...prev.budgets.byCategory,
                  [categoryId]: { limit: limitPKR, updatedAt: Date.now() },
                },
              },
            }));
            showToast('Category budget updated');
          }}
        />

        <CategoriesModal
          open={activeModal === 'categories'}
          categories={data.categories}
          onClose={() => setActiveModal(null)}
          onAddCategory={handleAddCategory}
          onRequestDeleteCategory={handleRequestDeleteCategory}
        />

        <OptionsModal
          open={activeModal === 'options'}
          settings={data.settings}
          onClose={() => setActiveModal(null)}
          onOpenBudgets={() => setActiveModal('budgets')}
          onOpenCategories={() => setActiveModal('categories')}
          onOpenWallets={() => setActiveModal('wallets')}
          onOpenProfile={() => {
            setIsFirstTimePrompt(false);
            setActiveModal('profile');
          }}
          onToggleDailyReminder={async (enabled) => {
            if (
              enabled &&
              typeof Notification !== 'undefined' &&
              Notification.permission === 'default'
            ) {
              await Notification.requestPermission();
            }
            updateData((prev) => ({
              ...prev,
              settings: { ...prev.settings, dailyReminder9pm: enabled, updatedAt: Date.now() },
            }));
            showToast(enabled ? 'Daily 9:00 PM reminder enabled' : 'Daily reminder disabled');
          }}
          onToggleBudgetAlerts={(enabled) =>
            updateData((prev) => ({
              ...prev,
              settings: { ...prev.settings, budgetAlerts: enabled, updatedAt: Date.now() },
            }))
          }
          onToggleBackupNotify={(enabled) =>
            updateData((prev) => ({
              ...prev,
              settings: { ...prev.settings, backupNotify: enabled, updatedAt: Date.now() },
            }))
          }
          onUpdateRates={(usdRate, eurRate) => {
            updateData((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                rates: { PKR: 1, USD: usdRate, EUR: eurRate },
                updatedAt: Date.now(),
              },
            }));
            showToast('Exchange rates updated');
          }}
          onExportJson={handleExportJson}
          onImportJsonFile={handleImportJson}
        />

        <ProfileSyncModal
          open={activeModal === 'profile'}
          isFirstTimePrompt={isFirstTimePrompt}
          user={user}
          hasToken={Boolean(getAccessToken())}
          syncStatus={syncStatus}
          syncError={syncError}
          lastSyncedAt={lastSyncedAt}
          isSigningIn={isSigningIn}
          wallets={data.wallets}
          walletBalances={walletBalances}
          settings={data.settings}
          onClose={handleDismissOnboarding}
          onContinueOffline={handleDismissOnboarding}
          onSignIn={handleSignIn}
          onManualSync={() => performSync(latestDataRef.current, { manual: true })}
          onSignOut={handleSignOut}
          onCurrencyChange={(currency: CurrencyCode) =>
            updateData((prev) => ({
              ...prev,
              settings: { ...prev.settings, currency, updatedAt: Date.now() },
            }))
          }
          onUpdateRates={(usdRate, eurRate) => {
            updateData((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                rates: { PKR: 1, USD: usdRate, EUR: eurRate },
                updatedAt: Date.now(),
              },
            }));
            showToast('Exchange rates updated');
          }}
          onToggleTheme={() =>
            updateData((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                theme: prev.settings.theme === 'dark' ? 'light' : 'dark',
                updatedAt: Date.now(),
              },
            }))
          }
          onToggleDailyReminder={async (enabled) => {
            if (
              enabled &&
              typeof Notification !== 'undefined' &&
              Notification.permission === 'default'
            ) {
              await Notification.requestPermission();
            }
            updateData((prev) => ({
              ...prev,
              settings: { ...prev.settings, dailyReminder9pm: enabled, updatedAt: Date.now() },
            }));
            showToast(enabled ? 'Daily 9:00 PM reminder enabled' : 'Daily reminder disabled');
          }}
          onToggleBudgetAlerts={(enabled) =>
            updateData((prev) => ({
              ...prev,
              settings: { ...prev.settings, budgetAlerts: enabled, updatedAt: Date.now() },
            }))
          }
          onToggleBackupNotify={(enabled) =>
            updateData((prev) => ({
              ...prev,
              settings: { ...prev.settings, backupNotify: enabled, updatedAt: Date.now() },
            }))
          }
          onAdjustWallet={handleAdjustWallet}
          onOpenWalletsTransfer={() => setActiveModal('wallets')}
          onOpenBudgets={() => setActiveModal('budgets')}
          onOpenCategories={() => setActiveModal('categories')}
          onExportJson={handleExportJson}
          onImportJsonFile={handleImportJson}
        />

        <ConfirmDialog state={confirmState} onCancel={() => setConfirmState(null)} />

        {/* Animated Toast Stack */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-28px)] max-w-[420px] space-y-2 pointer-events-none">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="rounded-[15px] bg-slate-900 dark:bg-slate-800 text-white px-4 py-2.5 text-xs sm:text-[13px] font-semibold shadow-xl border border-white/10 pointer-events-auto flex items-center justify-between gap-3"
              >
                <span>{t.text}</span>
                {t.receiptTx && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewingReceiptTx(t.receiptTx!);
                      setToasts((prev) => prev.filter((item) => item.id !== t.id));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold inline-flex items-center gap-1 shrink-0 transition"
                  >
                    <ReceiptText className="w-3 h-3" />
                    <span>View Receipt</span>
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}
