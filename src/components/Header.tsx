import React from 'react';
import { motion } from 'motion/react';
import { Menu, Moon, Search, Sun, User as UserIcon } from 'lucide-react';
import { CurrencyCode, SyncStatus, ThemeMode } from '../types/tracker';

interface HeaderProps {
  year: string;
  availableYears: string[];
  onYearChange: (year: string) => void;
  searchOpen: boolean;
  onToggleSearch: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  userPicture?: string | null;
  userName?: string | null;
  syncStatus: SyncStatus;
  onOpenMenu: () => void;
  onOpenProfile: () => void;
  onSyncDotClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  year,
  availableYears,
  onYearChange,
  searchOpen,
  onToggleSearch,
  theme,
  onToggleTheme,
  currency,
  onCurrencyChange,
  userPicture,
  userName,
  syncStatus,
  onOpenMenu,
  onOpenProfile,
  onSyncDotClick,
}) => {
  const dotClass =
    syncStatus === 'synced'
      ? 'bg-emerald-500'
      : syncStatus === 'syncing'
        ? 'sync-dot-syncing'
        : 'bg-red-500';

  return (
    <header className="sticky top-0 z-40 bg-[#f4f6fa]/85 dark:bg-[#0b1120]/85 backdrop-blur-md border-b border-slate-900/6 dark:border-white/8">
      <div className="max-w-5xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
        {/* Left: Menu lines icon */}
        <div className="flex items-center shrink-0">
          <motion.button
            type="button"
            whileHover={{ y: -1, scale: 1.04 }}
            whileTap={{ scale: 0.92 }}
            onClick={onOpenMenu}
            aria-label="Open menu"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-[13px] bg-white dark:bg-[#131c31] border border-slate-900/6 dark:border-white/8 shadow-sm flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1b2744] transition"
          >
            <Menu className="w-[18px] h-[18px]" strokeWidth={2.3} />
          </motion.button>
        </div>

        {/* Center: App name + Year Filter dropdown */}
        <div className="flex items-center justify-center gap-1.5 min-w-0 flex-1">
          <span className="font-extrabold text-[15px] sm:text-base tracking-tight text-slate-900 dark:text-white truncate">
            CozyLedger
          </span>
          <select
            aria-label="Year filter"
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            className="bg-white dark:bg-[#131c31] hover:bg-slate-50 dark:hover:bg-[#18233d] text-slate-800 dark:text-slate-100 border border-slate-900/8 dark:border-white/10 rounded-xl px-2 py-1 text-[11.5px] font-bold shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition shrink-0"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
            <option value="all">All Years</option>
          </select>
        </div>

        {/* Right: Search, Light/Dark, Currency (PKR/USD/EUR), Profile with Sync Dot */}
        <div className="flex items-center gap-1.5 shrink-0">
          <motion.button
            type="button"
            whileHover={{ y: -1, scale: 1.04 }}
            whileTap={{ scale: 0.92 }}
            onClick={onToggleSearch}
            aria-label="Search transactions"
            className={`w-9 h-9 rounded-[12px] border shadow-xs flex items-center justify-center transition ${
              searchOpen
                ? 'bg-[#0f294a] text-white border-transparent dark:bg-blue-500 dark:text-slate-950'
                : 'bg-white dark:bg-[#131c31] text-slate-700 dark:text-slate-200 border-slate-900/6 dark:border-white/8 hover:bg-slate-50 dark:hover:bg-[#18233d]'
            }`}
          >
            <Search className="w-4 h-4" strokeWidth={2.3} />
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -1, scale: 1.04 }}
            whileTap={{ scale: 0.92, rotate: 20 }}
            onClick={onToggleTheme}
            aria-label="Toggle light or dark mode"
            className="w-9 h-9 rounded-[12px] bg-white dark:bg-[#131c31] border border-slate-900/6 dark:border-white/8 shadow-xs flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#18233d] transition"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" strokeWidth={2.2} />
            ) : (
              <Moon className="w-4 h-4" strokeWidth={2.2} />
            )}
          </motion.button>

          <select
            aria-label="Currency selector"
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
            className="h-9 rounded-[12px] bg-white dark:bg-[#131c31] hover:bg-slate-50 dark:hover:bg-[#18233d] text-slate-800 dark:text-slate-100 border border-slate-900/6 dark:border-white/8 px-1.5 sm:px-2 text-[11.5px] font-bold shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
          >
            <option value="PKR">PKR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>

          <div className="relative inline-flex items-center justify-center">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              onClick={onOpenProfile}
              aria-label="Profile and Google Drive Backup"
              className="w-9 h-9 rounded-full bg-white dark:bg-[#131c31] border border-slate-900/10 dark:border-white/12 shadow-xs overflow-hidden flex items-center justify-center text-slate-700 dark:text-slate-200 transition"
            >
              {userPicture ? (
                <img
                  src={userPicture}
                  alt={userName || 'Profile'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4" strokeWidth={2.2} />
              )}
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                onSyncDotClick();
              }}
              aria-label={`Sync status: ${syncStatus}`}
              title={
                syncStatus === 'synced'
                  ? 'Synced — tap to auto-backup now'
                  : syncStatus === 'syncing'
                    ? 'Syncing...'
                    : 'Not synced — tap to retry and view error'
              }
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-[1.5px] border-[#f4f6fa] dark:border-[#0b1120] cursor-pointer ${dotClass}`}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
