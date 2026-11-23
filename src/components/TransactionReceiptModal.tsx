import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, Pencil, Share2, Trash2, X } from 'lucide-react';
import { Category, CurrencyCode, Transaction, Wallet } from '../types/tracker';
import { formatMoney } from '../utils/trackerData';

interface TransactionReceiptModalProps {
  transaction: Transaction | null;
  categories: Category[];
  wallets: Wallet[];
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onRequestDelete: (tx: Transaction) => void;
  onToast: (msg: string) => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  transaction,
  categories,
  wallets,
  currency,
  rates,
  onClose,
  onEdit,
  onRequestDelete,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);

  const category = transaction
    ? categories.find((c) => c.id === transaction.categoryId)
    : undefined;
  const wallet = transaction
    ? wallets.find((w) => w.id === transaction.walletId)
    : undefined;

  const isIncome = transaction?.type === 'income';
  const formattedAmt = transaction
    ? `${isIncome ? '+' : '-'}${formatMoney(transaction.amount, currency, rates)}`
    : '';

  const fullDate = transaction
    ? (() => {
        const [y, m, d] = transaction.date.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      })()
    : '';

  const receiptRef = transaction
    ? `#${transaction.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`
    : '';

  const recordedTime = transaction?.createdAt
    ? new Date(transaction.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const handleShareOrCopy = async () => {
    if (!transaction) return;
    const summaryText = [
      `CozyLedger ${isIncome ? 'Income' : 'Expense'} Receipt`,
      `Ref: ${receiptRef}`,
      `Title: ${transaction.title}`,
      `Amount: ${formattedAmt}`,
      `Category: ${category?.name || 'General'}`,
      `Wallet: ${wallet?.name || 'Cash'}`,
      `Date: ${fullDate}`,
      transaction.note ? `Note: ${transaction.note}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${transaction.title} Receipt`,
          text: summaryText,
        });
        return;
      } catch {
        // User cancelled or share unsupported — fall back to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      onToast('Receipt copied to clipboard');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      onToast('Could not copy receipt');
    }
  };

  return (
    <AnimatePresence>
      {transaction && (
        <motion.div
          key="receipt-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            key="receipt-sheet"
            initial={{ y: 36, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="w-full sm:max-w-[410px] bg-white dark:bg-[#131c31] text-slate-900 dark:text-slate-100 rounded-t-[26px] sm:rounded-[26px] shadow-2xl border border-slate-900/6 dark:border-white/10 overflow-hidden"
          >
            {/* Top Header */}
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <span className="text-xs font-extrabold tracking-wide text-slate-400 dark:text-slate-500">
                {isIncome ? 'Income Receipt' : 'Expense Receipt'} · {receiptRef}
              </span>
              <motion.button
                type="button"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                aria-label="Close receipt"
                className="w-8 h-8 rounded-[11px] bg-slate-100 dark:bg-[#18233d] text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[#1f2d4d] transition"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Hero Receipt Amount & Title */}
            <div className="px-5 pt-2 pb-5 text-center">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, type: 'spring', stiffness: 380, damping: 24 }}
                className="w-14 h-14 mx-auto rounded-[18px] bg-slate-100 dark:bg-[#18233d] flex items-center justify-center text-2xl shadow-xs mb-3"
              >
                {category?.icon || (isIncome ? '💚' : '💸')}
              </motion.div>

              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                {transaction.title}
              </h3>

              <div
                className={`mt-1.5 text-3xl font-extrabold font-mono-num tracking-tight ${
                  isIncome
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formattedAmt}
              </div>
            </div>

            {/* Perforated Receipt Divider */}
            <div className="relative flex items-center px-5">
              <div className="w-4 h-4 rounded-full bg-slate-950/35 dark:bg-slate-950/70 -ml-7 shrink-0" />
              <div className="flex-1 border-t-2 border-dashed border-slate-200 dark:border-white/12 mx-2" />
              <div className="w-4 h-4 rounded-full bg-slate-950/35 dark:bg-slate-950/70 -mr-7 shrink-0" />
            </div>

            {/* Line-Item Details */}
            <div className="px-5 py-4 space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Category</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-right">
                  {category ? `${category.icon} ${category.name}` : 'General'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Wallet</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-right">
                  {wallet ? `${wallet.icon} ${wallet.name}` : 'Cash'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Date</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-right">
                  {fullDate}
                </span>
              </div>

              {recordedTime && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Recorded</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono-num text-right">
                    {recordedTime}
                  </span>
                </div>
              )}

              {transaction.note && (
                <div className="pt-2 border-t border-slate-100 dark:border-white/8">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Note
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed">
                    {transaction.note}
                  </p>
                </div>
              )}
            </div>

            {/* Receipt Action Buttons */}
            <div className="px-5 pb-6 pt-2 grid grid-cols-3 gap-2">
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleShareOrCopy}
                className="h-11 rounded-[14px] bg-slate-100 dark:bg-[#18233d] hover:bg-slate-200/80 dark:hover:bg-[#1f2d4d] text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    {typeof navigator.share === 'function' ? (
                      <Share2 className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Receipt</span>
                  </>
                )}
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  const tx = transaction;
                  onClose();
                  onEdit(tx);
                }}
                className="h-11 rounded-[14px] bg-[#0f294a] dark:bg-blue-500 text-white dark:text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-95 transition"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  const tx = transaction;
                  onClose();
                  onRequestDelete(tx);
                }}
                className="h-11 rounded-[14px] bg-rose-500/12 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
