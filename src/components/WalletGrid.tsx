import React from 'react';
import { motion } from 'motion/react';
import { CurrencyCode, Wallet } from '../types/tracker';
import { formatMoney } from '../utils/trackerData';

interface WalletGridProps {
  wallets: Wallet[];
  balances: Record<string, number>;
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  onSelectWallet: () => void;
}

export const WalletGrid: React.FC<WalletGridProps> = ({
  wallets,
  balances,
  currency,
  rates,
  onSelectWallet,
}) => {
  return (
    <section className="grid grid-cols-2 gap-2.5">
      {wallets.map((w, idx) => (
        <motion.button
          key={w.id}
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.04 * idx, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -2, scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSelectWallet}
          className="group text-left rounded-[20px] bg-white dark:bg-[#131c31] border border-slate-900/6 dark:border-white/8 p-3.5 shadow-[0_10px_26px_-12px_rgba(15,35,75,0.12)] dark:shadow-[0_12px_28px_-12px_rgba(0,0,0,0.45)] hover:shadow-[0_14px_30px_-10px_rgba(15,35,75,0.18)] flex items-center gap-3 hover:bg-slate-50/90 dark:hover:bg-[#18233d] transition-colors"
        >
          <div
            className={`w-10 h-10 rounded-[13px] flex items-center justify-center text-lg shrink-0 transition-transform duration-200 group-hover:scale-110 ${w.accentBg} ${w.accentText}`}
          >
            {w.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {w.name}
            </div>
            <div className="text-[14.5px] font-extrabold text-slate-900 dark:text-slate-100 font-mono-num truncate">
              {formatMoney(balances[w.id] || 0, currency, rates)}
            </div>
          </div>
        </motion.button>
      ))}
    </section>
  );
};
