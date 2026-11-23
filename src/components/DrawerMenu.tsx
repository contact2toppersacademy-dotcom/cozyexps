import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Cloud,
  HandCoins,
  MinusCircle,
  PlusCircle,
  Settings,
  Tags,
  Target,
  Wallet,
  X,
} from 'lucide-react';

interface DrawerMenuProps {
  open: boolean;
  userSubtitle: string;
  onClose: () => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onOpenWallets: () => void;
  onOpenLoans: () => void;
  onOpenBudgets: () => void;
  onOpenCategories: () => void;
  onOpenOptions: () => void;
  onOpenProfile: () => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  open,
  userSubtitle,
  onClose,
  onAddIncome,
  onAddExpense,
  onOpenWallets,
  onOpenLoans,
  onOpenBudgets,
  onOpenCategories,
  onOpenOptions,
  onOpenProfile,
}) => {
  const navItems = [
    { label: 'Add Income', icon: <PlusCircle className="w-4 h-4 text-emerald-500" />, action: onAddIncome },
    { label: 'Add Expense', icon: <MinusCircle className="w-4 h-4 text-rose-500" />, action: onAddExpense },
    { label: 'Wallets & Transfer', icon: <Wallet className="w-4 h-4 text-blue-500" />, action: onOpenWallets },
    { label: 'Loan Tracker', icon: <HandCoins className="w-4 h-4 text-amber-500" />, action: onOpenLoans },
    { label: 'Budgets & Alerts', icon: <Target className="w-4 h-4 text-teal-500" />, action: onOpenBudgets },
    { label: 'Categories', icon: <Tags className="w-4 h-4 text-violet-500" />, action: onOpenCategories },
    { label: 'Settings & Reminders', icon: <Settings className="w-4 h-4 text-slate-500" />, action: onOpenOptions },
    { label: 'Google Drive Backup', icon: <Cloud className="w-4 h-4 text-sky-500" />, action: onOpenProfile },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-xs"
            onClick={onClose}
          />

          <motion.aside
            key="drawer-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-[285px] max-w-[84vw] bg-white dark:bg-[#131c31] border-r border-slate-900/6 dark:border-white/8 p-4 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-900/6 dark:border-white/8">
              <div className="min-w-0">
                <div className="text-[17px] font-extrabold text-slate-900 dark:text-white tracking-tight">
                  CozyLedger
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {userSubtitle}
                </div>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.07, rotate: 90 }}
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                aria-label="Close navigation menu"
                className="w-8 h-8 rounded-[11px] bg-slate-100 dark:bg-[#18233d] text-slate-600 dark:text-slate-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            <nav className="space-y-1 flex-1 overflow-y-auto">
              {navItems.map((item, idx) => (
                <motion.button
                  key={item.label}
                  type="button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * idx, duration: 0.18 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onClose();
                    item.action();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#18233d] transition text-left"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
