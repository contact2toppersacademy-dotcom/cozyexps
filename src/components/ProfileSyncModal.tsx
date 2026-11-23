import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeftRight,
  Download,
  Moon,
  RefreshCw,
  Sun,
  Tags,
  Target,
  Upload,
  User as UserIcon,
} from 'lucide-react';
import { GoogleUserProfile } from '../services/googleAuth';
import { AppSettings, CurrencyCode, SyncStatus, Wallet } from '../types/tracker';
import { formatMoney, fromBasePKR, toBasePKR } from '../utils/trackerData';
import { ModalShell } from './ModalShell';

interface ProfileSyncModalProps {
  open: boolean;
  isFirstTimePrompt?: boolean;
  user: GoogleUserProfile | null;
  hasToken: boolean;
  syncStatus: SyncStatus;
  syncError: string;
  lastSyncedAt: string;
  isSigningIn: boolean;
  wallets: Wallet[];
  walletBalances: Record<string, number>;
  settings: AppSettings;
  onClose: () => void;
  onContinueOffline: () => void;
  onSignIn: () => void;
  onManualSync: () => void;
  onSignOut: () => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onUpdateRates: (usdRate: number, eurRate: number) => void;
  onToggleTheme: () => void;
  onToggleDailyReminder: (enabled: boolean) => void;
  onToggleBudgetAlerts: (enabled: boolean) => void;
  onToggleBackupNotify: (enabled: boolean) => void;
  onAdjustWallet: (walletId: string, newBalancePKR: number) => void;
  onOpenWalletsTransfer: () => void;
  onOpenBudgets: () => void;
  onOpenCategories: () => void;
  onExportJson: () => void;
  onImportJsonFile: (file: File) => void;
}

export const ProfileSyncModal: React.FC<ProfileSyncModalProps> = ({
  open,
  isFirstTimePrompt = false,
  user,
  hasToken,
  syncStatus,
  syncError,
  lastSyncedAt,
  isSigningIn,
  wallets,
  walletBalances,
  settings,
  onClose,
  onContinueOffline,
  onSignIn,
  onManualSync,
  onSignOut,
  onCurrencyChange,
  onUpdateRates,
  onToggleTheme,
  onToggleDailyReminder,
  onToggleBudgetAlerts,
  onToggleBackupNotify,
  onAdjustWallet,
  onOpenWalletsTransfer,
  onOpenBudgets,
  onOpenCategories,
  onExportJson,
  onImportJsonFile,
}) => {
  const [usdRate, setUsdRate] = useState(String(settings.rates.USD || 278));
  const [eurRate, setEurRate] = useState(String(settings.rates.EUR || 295));
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setUsdRate(String(settings.rates.USD || 278));
    setEurRate(String(settings.rates.EUR || 295));
    setEditingWalletId(null);
  }, [open, settings.rates.USD, settings.rates.EUR]);

  const startAdjust = (w: Wallet) => {
    setEditingWalletId(w.id);
    const curDisp = fromBasePKR(walletBalances[w.id] || 0, settings.currency, settings.rates);
    setAdjustValue(String(Number(curDisp.toFixed(2))));
  };

  const submitAdjust = (walletId: string) => {
    const val = parseFloat(adjustValue);
    if (Number.isNaN(val)) return;
    onAdjustWallet(walletId, toBasePKR(val, settings.currency, settings.rates));
    setEditingWalletId(null);
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    const u = parseFloat(usdRate);
    const eu = parseFloat(eurRate);
    if (u > 0 && eu > 0) {
      onUpdateRates(u, eu);
    }
  };

  return (
    <ModalShell
      open={open}
      title={!user && isFirstTimePrompt ? 'Welcome to CozyLedger' : 'Profile & Settings'}
      onClose={onClose}
    >
      <div className="space-y-4">
        {syncError && !isFirstTimePrompt && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[15px] bg-rose-500/12 border border-rose-500/25 text-rose-700 dark:text-rose-300 p-3"
          >
            <div className="text-xs font-extrabold">Sync Issue</div>
            <div className="text-xs mt-0.5 leading-relaxed">{syncError}</div>
          </motion.div>
        )}

        {/* 1. User Profile & Google Drive Sync */}
        {!user ? (
          <div className="rounded-[18px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 p-4 space-y-3">
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Sign in with Google to automatically create your personal account and store all your
              transactions, wallets, loans, budgets, and settings inside{' '}
              <strong>your own Google Drive</strong> (<code>appDataFolder/expense_tracker.json</code>).
            </p>

            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSigningIn}
              onClick={onSignIn}
              className="gsi-material-button"
            >
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isSigningIn ? 'Connecting your Google Drive...' : 'Sign in with Google'}
                </span>
              </div>
            </motion.button>

            {isFirstTimePrompt && (
              <button
                type="button"
                onClick={onContinueOffline}
                className="w-full py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                Use Offline for Now
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-[18px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 p-3.5 space-y-3">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-900/10 dark:border-white/15"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold truncate">{user.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {lastSyncedAt
                    ? `Synced: ${lastSyncedAt}`
                    : 'Drive: appDataFolder/expense_tracker.json'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                disabled={syncStatus === 'syncing' || isSigningIn}
                onClick={hasToken ? onManualSync : onSignIn}
                className="h-10 rounded-[13px] bg-[#0f294a] dark:bg-blue-500 text-white dark:text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-95 transition"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
                />
                <span>{hasToken ? 'Backup Now' : 'Reconnect & Sync'}</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={onSignOut}
                className="h-10 rounded-[13px] bg-rose-500/12 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition"
              >
                Sign Out
              </motion.button>
            </div>
          </div>
        )}

        {/* 2. Bank Accounts & Wallets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 tracking-wide">
              Bank Accounts & Wallets
            </h3>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWalletsTransfer();
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 hover:underline"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>Transfer</span>
            </button>
          </div>

          <div className="space-y-2">
            {wallets.map((w) => (
              <div
                key={w.id}
                className="rounded-[15px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 p-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-base shrink-0 ${w.accentBg} ${w.accentText}`}
                    >
                      {w.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{w.name}</div>
                      <div className="text-xs font-extrabold text-slate-600 dark:text-slate-300 font-mono-num">
                        {formatMoney(walletBalances[w.id] || 0, settings.currency, settings.rates)}
                      </div>
                    </div>
                  </div>

                  {editingWalletId !== w.id && (
                    <button
                      type="button"
                      onClick={() => startAdjust(w)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-[#1f2d4d] transition"
                    >
                      Edit Balance
                    </button>
                  )}
                </div>

                {editingWalletId === w.id && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <input
                      type="number"
                      step="0.01"
                      value={adjustValue}
                      onChange={(e) => setAdjustValue(e.target.value)}
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#131c31] border border-slate-900/10 dark:border-white/10 text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => submitAdjust(w.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0f294a] dark:bg-blue-500 text-white dark:text-slate-950 text-[11px] font-bold"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingWalletId(null)}
                      className="px-2 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-[11px] font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Currency & Exchange Rates */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 tracking-wide">
            Currency & Exchange Rates
          </h3>
          <div className="rounded-[16px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 p-3 space-y-2.5">
            <div className="grid grid-cols-3 gap-1.5">
              {(['PKR', 'USD', 'EUR'] as CurrencyCode[]).map((cur) => {
                const active = settings.currency === cur;
                return (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => onCurrencyChange(cur)}
                    className={`py-2 rounded-xl text-xs font-extrabold transition ${
                      active
                        ? 'bg-[#0f294a] text-white dark:bg-blue-500 dark:text-slate-950 shadow-xs'
                        : 'bg-white dark:bg-[#131c31] text-slate-700 dark:text-slate-300 border border-slate-900/6 dark:border-white/8'
                    }`}
                  >
                    {cur}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSaveRates} className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  1 USD = PKR
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={usdRate}
                  onChange={(e) => setUsdRate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  1 EUR = PKR
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={eurRate}
                  onChange={(e) => setEurRate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 text-xs font-bold"
                />
              </div>
              <button
                type="submit"
                className="col-span-2 h-8 rounded-xl bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 text-xs font-bold hover:bg-slate-100 dark:hover:bg-[#1f2d4d] transition"
              >
                Save Exchange Rates
              </button>
            </form>
          </div>
        </div>

        {/* 4. All Settings */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 tracking-wide">
            All Settings
          </h3>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-[15px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 text-left hover:bg-slate-100 dark:hover:bg-[#1f2d4d] transition"
            >
              <div>
                <div className="text-xs font-bold">Appearance</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </div>
              </div>
              <span className="w-8 h-8 rounded-xl bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 flex items-center justify-center">
                {settings.theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </span>
            </button>

            <label className="flex items-center justify-between gap-3 p-3 rounded-[15px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 cursor-pointer">
              <div>
                <div className="text-xs font-bold">Daily Reminder (9:00 PM)</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Reminds you daily at 21:00 to log expenses
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.dailyReminder9pm}
                onChange={(e) => onToggleDailyReminder(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded shrink-0"
              />
            </label>

            <label className="flex items-center justify-between gap-3 p-3 rounded-[15px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 cursor-pointer">
              <div>
                <div className="text-xs font-bold">Budget Alerts</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Alert at 80% and 100% of monthly limit
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.budgetAlerts}
                onChange={(e) => onToggleBudgetAlerts(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded shrink-0"
              />
            </label>

            <label className="flex items-center justify-between gap-3 p-3 rounded-[15px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 cursor-pointer">
              <div>
                <div className="text-xs font-bold">Backup Done Notifications</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Notify when Google Drive sync finishes
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.backupNotify}
                onChange={(e) => onToggleBackupNotify(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded shrink-0"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBudgets();
              }}
              className="h-9 rounded-[13px] bg-slate-100 dark:bg-[#18233d] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-slate-200/80 dark:hover:bg-[#1f2d4d] transition"
            >
              <Target className="w-3.5 h-3.5 text-teal-500" />
              <span>Budgets</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCategories();
              }}
              className="h-9 rounded-[13px] bg-slate-100 dark:bg-[#18233d] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-slate-200/80 dark:hover:bg-[#1f2d4d] transition"
            >
              <Tags className="w-3.5 h-3.5 text-violet-500" />
              <span>Categories</span>
            </button>
            <button
              type="button"
              onClick={onExportJson}
              className="h-9 rounded-[13px] bg-slate-100 dark:bg-[#18233d] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-slate-200/80 dark:hover:bg-[#1f2d4d] transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-9 rounded-[13px] bg-slate-100 dark:bg-[#18233d] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-slate-200/80 dark:hover:bg-[#1f2d4d] transition"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-500" />
              <span>Import JSON</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportJsonFile(f);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      </div>
    </ModalShell>
  );
};
