import React from 'react';
import { motion } from 'motion/react';
import { HandCoins, Minus, Plus, SlidersHorizontal } from 'lucide-react';

interface ActionGridProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onOpenLoan: () => void;
  onOpenOptions: () => void;
}

export const ActionGrid: React.FC<ActionGridProps> = ({
  onAddIncome,
  onAddExpense,
  onOpenLoan,
  onOpenOptions,
}) => {
  const items = [
    {
      label: 'Add Income',
      onClick: onAddIncome,
      badge: 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400',
      icon: <Plus className="w-5 h-5" strokeWidth={2.5} />,
    },
    {
      label: 'Add Expense',
      onClick: onAddExpense,
      badge: 'bg-rose-500/12 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400',
      icon: <Minus className="w-5 h-5" strokeWidth={2.5} />,
    },
    {
      label: 'Loan',
      onClick: onOpenLoan,
      badge: 'bg-amber-500/12 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400',
      icon: <HandCoins className="w-5 h-5" strokeWidth={2.2} />,
    },
    {
      label: 'Options',
      onClick: onOpenOptions,
      badge: 'bg-blue-500/12 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400',
      icon: <SlidersHorizontal className="w-5 h-5" strokeWidth={2.2} />,
    },
  ];

  return (
    <section className="grid grid-cols-4 gap-2.5">
      {items.map((item, idx) => (
        <motion.button
          key={item.label}
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.06 + 0.04 * idx, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.94 }}
          onClick={item.onClick}
          className="group rounded-[20px] bg-white dark:bg-[#131c31] border border-slate-900/6 dark:border-white/8 py-3.5 px-1.5 shadow-[0_10px_26px_-12px_rgba(15,35,75,0.12)] dark:shadow-[0_12px_28px_-12px_rgba(0,0,0,0.45)] hover:shadow-[0_14px_30px_-10px_rgba(15,35,75,0.18)] flex flex-col items-center justify-center gap-2 hover:bg-slate-50/90 dark:hover:bg-[#18233d] transition-colors"
        >
          <div
            className={`w-10 h-10 rounded-[13px] flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${item.badge}`}
          >
            {item.icon}
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
            {item.label}
          </span>
        </motion.button>
      ))}
    </section>
  );
};
