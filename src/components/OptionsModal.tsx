import React, { useEffect, useRef, useState } from 'react';
import { AppSettings } from '../types/tracker';
import { ModalShell } from './ModalShell';

interface OptionsModalProps {
  open: boolean;
  settings: AppSettings;
  onClose: () => void;
  onOpenBudgets: () => void;
  onOpenCategories: () => void;
  onOpenWallets: () => void;
  onOpenProfile: () => void;
  onToggleDailyReminder: (enabled: boolean) => void;
  onToggleBudgetAlerts: (enabled: boolean) => void;
  onToggleBackupNotify: (enabled: boolean) => void;
  onUpdateRates: (usdRate: number, eurRate: number) => void;
  onExportJson: () => void;
  onImportJsonFile: (file: File) => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  open,
  settings,
  onClose,
  onOpenBudgets,
  onOpenCategories,
  onOpenWallets,
  onOpenProfile,
  onToggleDailyReminder,
  onToggleBudgetAlerts,
  onToggleBackupNotify,
  onUpdateRates,
  onExportJson,
  onImportJsonFile,
}) => {
  const [usdRate, setUsdRate] = useState(String(settings.rates.USD || 278));
  const [eurRate, setEurRate] = useState(String(settings.rates.EUR || 295));
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setUsdRate(String(settings.rates.USD || 278));
    setEurRate(String(settings.rates.EUR || 295));
  }, [open, settings.rates.USD, settings.rates.EUR]);

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    const u = parseFloat(usdRate);
    const eu = parseFloat(eurRate);
    if (u > 0 && eu > 0) {
      onUpdateRates(u, eu);
    }
  };

  return (
    <ModalShell open={open} title="Options & Settings" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenBudgets();
          }}
          className="h-10 rounded-[14px] bg-slate-100 dark:bg-[#18233d] text-xs font-bold hover:bg-slate-200/80 dark:hover:bg-[#1f2d4d] transition"
        >
          🎯 Budgets
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenCategories();
          }}
          className="h-10 rounded-[14px] bg-slate-100 dark:bg-[#18233d] text-xs font-bold hover:bg-slate-200/80 dark:hover:bg-[#1f2d4d] transition"
        >
          🏷️ Categories
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenWallets();
          }}
          className="h-10 rounded-[14px] bg-slate-100 dark:bg-[#18233d] text-xs font-bold hover:bg-slate-200/80 dark:hover:bg-[#1f2d4d] transition"
        >
          👛 Wallets
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenProfile();
          }}
          className="h-10 rounded-[14px] bg-slate-100 dark:bg-[#18233d] text-xs font-bold hover:bg-slate-200/80 dark:hover:bg-[#1f2d4d] transition"
        >
          ☁️ Drive Backup
        </button>
      </div>

      <div className="space-y-2.5 mb-4">
        <label className="flex items-center justify-between gap-3 p-3 rounded-[15px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 cursor-pointer">
          <div>
            <div className="text-[13.5px] font-bold">Daily Reminder (9:00 PM)</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Reminds you daily at 21:00 to log expenses
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.dailyReminder9pm}
            onChange={(e) => onToggleDailyReminder(e.target.checked)}
            className="w-5 h-5 accent-emerald-600 rounded shrink-0"
          />
        </label>

        <label className="flex items-center justify-between gap-3 p-3 rounded-[15px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 cursor-pointer">
          <div>
            <div className="text-[13.5px] font-bold">Budget Alerts</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Alert at 80% and 100% of monthly limit
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.budgetAlerts}
            onChange={(e) => onToggleBudgetAlerts(e.target.checked)}
            className="w-5 h-5 accent-emerald-600 rounded shrink-0"
          />
        </label>

        <label className="flex items-center justify-between gap-3 p-3 rounded-[15px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 cursor-pointer">
          <div>
            <div className="text-[13.5px] font-bold">Backup Done Notifications</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Notify when Google Drive backup finishes
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.backupNotify}
            onChange={(e) => onToggleBackupNotify(e.target.checked)}
            className="w-5 h-5 accent-emerald-600 rounded shrink-0"
          />
        </label>
      </div>

      <form
        onSubmit={handleSaveRates}
        className="rounded-[16px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 p-3.5 mb-3"
      >
        <div className="text-xs font-extrabold mb-2">Currency Rates (Base: PKR)</div>
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
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
              className="w-full px-3 py-2 rounded-[12px] bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 text-xs font-bold"
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
              className="w-full px-3 py-2 rounded-[12px] bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 text-xs font-bold"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full h-9 rounded-[12px] bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 text-xs font-bold hover:bg-slate-100 dark:hover:bg-[#1f2d4d] transition"
        >
          Update Rates
        </button>
      </form>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onExportJson}
          className="h-10 rounded-[14px] bg-slate-100 dark:bg-[#18233d] text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#1f2d4d] transition"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="h-10 rounded-[14px] bg-slate-100 dark:bg-[#18233d] text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#1f2d4d] transition"
        >
          Import & Merge JSON
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
    </ModalShell>
  );
};
