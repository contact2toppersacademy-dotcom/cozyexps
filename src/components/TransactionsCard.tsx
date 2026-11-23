import React, { useRef } from 'react';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { Calendar, ReceiptText } from 'lucide-react';
import {
  Category,
  CurrencyCode,
  Transaction,
  TxFilterType,
  Wallet,
} from '../types/tracker';
import { formatDateShort, formatMoney } from '../utils/trackerData';

interface TransactionsCardProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  filter: TxFilterType;
  selectedDate: string;
  onFilterChange: (filter: TxFilterType) => void;
  onDateChange: (date: string) => void;
  onSelectTransaction: (tx: Transaction) => void;
}

const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035,
    },
  },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.24,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    x: -14,
    scale: 0.98,
    transition: { duration: 0.16 },
  },
};

export const TransactionsCard: React.FC<TransactionsCardProps> = ({
  transactions,
  categories,
  wallets,
  currency,
  rates,
  filter,
  selectedDate,
  onFilterChange,
  onDateChange,
  onSelectTransaction,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const walletMap = new Map(wallets.map((w) => [w.id, w]));

  const filterButtons: Array<{ key: TxFilterType; label: string }> = [
    { key: '7days', label: 'Last 7 Days' },
    { key: 'all', label: 'All' },
    { key: 'income', label: 'Income' },
    { key: 'expense', label: 'Expense' },
  ];

  const handleOpenDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.click();
    }
  };

  // Key list container by filter & selectedDate so filter switches smoothly re-animate visible rows
  const listKey = `${filter}-${selectedDate}-${currency}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[20px] bg-white dark:bg-[#131c31] border border-slate-900/6 dark:border-white/8 p-4 sm:p-5 shadow-[0_12px_30px_-12px_rgba(15,35,75,0.12)] dark:shadow-[0_14px_32px_-12px_rgba(0,0,0,0.45)] flex flex-col gap-3.5"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[15px] sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
          Recent Transactions
        </h2>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono-num">
          {transactions.length} {transactions.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Top Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 relative">
        {filterButtons.map((btn) => {
          const active = filter === btn.key;
          return (
            <button
              key={btn.key}
              type="button"
              onClick={() => onFilterChange(btn.key)}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
                active
                  ? 'text-white dark:text-slate-950'
                  : 'bg-slate-100 dark:bg-[#18233d] text-slate-600 dark:text-slate-300 hover:bg-slate-200/75 dark:hover:bg-[#1f2d4d]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="txFilterActiveBg"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-[#0f294a] dark:bg-blue-500 shadow-xs"
                />
              )}
              <span className="relative z-10">{btn.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleOpenDatePicker}
          className={`relative px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition cursor-pointer ${
            filter === 'date'
              ? 'text-white dark:text-slate-950'
              : 'bg-slate-100 dark:bg-[#18233d] text-slate-600 dark:text-slate-300 hover:bg-slate-200/75 dark:hover:bg-[#1f2d4d]'
          }`}
        >
          {filter === 'date' && (
            <motion.span
              layoutId="txFilterActiveBg"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="absolute inset-0 rounded-xl bg-[#0f294a] dark:bg-blue-500 shadow-xs"
            />
          )}
          <Calendar className="w-3.5 h-3.5 relative z-10" />
          <span className="relative z-10">
            {filter === 'date' && selectedDate ? formatDateShort(selectedDate) : 'Date'}
          </span>
        </button>

        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          onChange={(e) => {
            if (e.target.value) {
              onDateChange(e.target.value);
            }
          }}
          className="sr-only"
          aria-label="Filter by specific date"
        />
      </div>

      {/* Scrollable Transactions List */}
      <div className="max-h-[380px] lg:max-h-[470px] overflow-y-auto cozy-scroll pr-0.5">
        {transactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="py-10 px-4 text-center text-sm text-slate-500 dark:text-slate-400"
          >
            <div className="text-3xl mb-2">🍃</div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">No transactions yet</p>
            <p className="text-xs mt-1">
              Tap Add Income or Add Expense to record your first entry.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={listKey}
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            <AnimatePresence mode="popLayout">
              {transactions.map((tx) => {
                const cat = categoryMap.get(tx.categoryId);
                const wal = walletMap.get(tx.walletId);
                const isIncome = tx.type === 'income';
                const catIcon = cat?.icon || (isIncome ? '💚' : '💸');
                const catName = cat?.name || 'General';
                const walName = wal?.name || 'Cash';

                return (
                  <motion.button
                    key={`${tx.id}-${tx.updatedAt}`}
                    type="button"
                    layout
                    variants={rowVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    whileHover={{ y: -1, x: 2 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => onSelectTransaction(tx)}
                    className="group w-full text-left rounded-[16px] bg-slate-50/90 dark:bg-[#18233d]/85 hover:bg-slate-100 dark:hover:bg-[#1f2d4d] px-3 py-2.5 flex items-center gap-3 transition-colors shadow-2xs hover:shadow-xs"
                  >
                    <div className="w-10 h-10 rounded-[13px] bg-white dark:bg-[#131c31] shadow-xs flex items-center justify-center text-lg shrink-0 transition-transform duration-200 group-hover:scale-108">
                      {catIcon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                        <span className="truncate">{tx.title}</span>
                        <ReceiptText className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                      <div className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        <span>{catName}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>{formatDateShort(tx.date)}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-[13.5px] font-extrabold font-mono-num ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatMoney(tx.amount, currency, rates)}
                      </div>
                      <div className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {walName}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
};
