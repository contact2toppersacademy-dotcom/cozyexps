import React from 'react';
import { motion } from 'motion/react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { CurrencyCode } from '../types/tracker';
import { formatMoney } from '../utils/trackerData';

interface BalanceCardProps {
  totalBalancePKR: number;
  incomePKR: number;
  expensePKR: number;
  year: string;
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  totalBalancePKR,
  incomePKR,
  expensePKR,
  year,
  currency,
  rates,
}) => {
  const periodText = year === 'all' ? 'All Time' : year;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#0a1d37] via-[#133666] to-[#1d4ed8] text-white p-5 shadow-[0_18px_38px_-14px_rgba(11,31,58,0.55)] transition-shadow hover:shadow-[0_22px_44px_-14px_rgba(11,31,58,0.65)]"
    >
      {/* Soft ambient highlight */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

      <div className="flex items-center justify-between text-xs font-semibold text-white/75">
        <span>Total Balance</span>
        <span>{periodText}</span>
      </div>

      <motion.div
        key={`${totalBalancePKR}-${currency}`}
        initial={{ opacity: 0.7, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-1.5 mb-4 text-3xl sm:text-[34px] font-extrabold tracking-tight font-mono-num"
      >
        {formatMoney(totalBalancePKR, currency, rates)}
      </motion.div>

      <div className="grid grid-cols-2 gap-2.5">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="rounded-[15px] bg-white/10 backdrop-blur-sm border border-white/12 px-3 py-2.5 flex items-center gap-2.5 transition-colors hover:bg-white/15"
        >
          <div className="w-8 h-8 rounded-[10px] bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.6} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-white/75 truncate">
              {year === 'all' ? 'Income' : `Income · ${year}`}
            </div>
            <div className="text-sm sm:text-[15px] font-bold text-emerald-300 font-mono-num truncate">
              {formatMoney(incomePKR, currency, rates)}
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="rounded-[15px] bg-white/10 backdrop-blur-sm border border-white/12 px-3 py-2.5 flex items-center gap-2.5 transition-colors hover:bg-white/15"
        >
          <div className="w-8 h-8 rounded-[10px] bg-rose-400/20 text-rose-300 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-4 h-4" strokeWidth={2.6} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-white/75 truncate">
              {year === 'all' ? 'Expense' : `Expense · ${year}`}
            </div>
            <div className="text-sm sm:text-[15px] font-bold text-rose-300 font-mono-num truncate">
              {formatMoney(expensePKR, currency, rates)}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};
