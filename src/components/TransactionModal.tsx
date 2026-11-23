import React, { useEffect, useState } from 'react';
import {
  Category,
  CurrencyCode,
  Transaction,
  TransactionType,
  Wallet,
} from '../types/tracker';
import { fromBasePKR, toBasePKR, todayStr } from '../utils/trackerData';
import { ModalShell } from './ModalShell';

interface TransactionModalProps {
  open: boolean;
  initialType: TransactionType;
  editingTx: Transaction | null;
  categories: Category[];
  wallets: Wallet[];
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  onRequestDelete: (tx: Transaction) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  open,
  initialType,
  editingTx,
  categories,
  wallets,
  currency,
  rates,
  onClose,
  onSave,
  onRequestDelete,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr());
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('cash');
  const [note, setNote] = useState('');

  const activeCategories = categories.filter((c) => !c.deleted && c.type === type);

  useEffect(() => {
    if (!open) return;
    if (editingTx) {
      setType(editingTx.type);
      const disp = fromBasePKR(editingTx.amount, currency, rates);
      setAmount(String(Number(disp.toFixed(2))));
      setDate(editingTx.date);
      setTitle(editingTx.title);
      setCategoryId(editingTx.categoryId);
      setWalletId(editingTx.walletId);
      setNote(editingTx.note || '');
    } else {
      setType(initialType);
      setAmount('');
      setDate(todayStr());
      setTitle('');
      setWalletId(wallets[0]?.id || 'cash');
      setNote('');
      const firstCat = categories.find((c) => !c.deleted && c.type === initialType);
      setCategoryId(firstCat?.id || '');
    }
  }, [open, editingTx, initialType, currency, rates, categories, wallets]);

  useEffect(() => {
    if (!activeCategories.some((c) => c.id === categoryId)) {
      setCategoryId(activeCategories[0]?.id || '');
    }
  }, [type, activeCategories, categoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0 || !title.trim()) return;
    const basePKR = Math.round(toBasePKR(num, currency, rates) * 100) / 100;
    onSave({
      id: editingTx?.id,
      type,
      amount: basePKR,
      title: title.trim(),
      categoryId: categoryId || activeCategories[0]?.id || '',
      walletId,
      date,
      note: note.trim(),
      deleted: false,
    });
    onClose();
  };

  return (
    <ModalShell
      open={open}
      title={editingTx ? 'Edit Transaction' : type === 'income' ? 'Add Income' : 'Add Expense'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-[14px] bg-slate-100 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/6">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 rounded-[11px] text-xs font-bold transition ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 rounded-[11px] text-xs font-bold transition ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Expense
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Amount ({currency})
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2.5 rounded-[14px] bg-slate-100 dark:bg-[#18233d] border border-slate-900/6 dark:border-white/8 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-[14px] bg-slate-100 dark:bg-[#18233d] border border-slate-900/6 dark:border-white/8 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            Title / Name
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Groceries, Salary, Coffee"
            className="w-full px-3 py-2.5 rounded-[14px] bg-slate-100 dark:bg-[#18233d] border border-slate-900/6 dark:border-white/8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-[14px] bg-slate-100 dark:bg-[#18233d] border border-slate-900/6 dark:border-white/8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Wallet
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-[14px] bg-slate-100 dark:bg-[#18233d] border border-slate-900/6 dark:border-white/8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.icon} {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Short note..."
            className="w-full px-3 py-2.5 rounded-[14px] bg-slate-100 dark:bg-[#18233d] border border-slate-900/6 dark:border-white/8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <div className="flex gap-2.5 pt-2">
          {editingTx && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestDelete(editingTx);
              }}
              className="px-4 h-11 rounded-[15px] bg-rose-500/12 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400 text-sm font-bold hover:bg-rose-500/20 transition"
            >
              Delete
            </button>
          )}
          <button
            type="submit"
            className="flex-1 h-11 rounded-[15px] bg-[#0f294a] dark:bg-blue-500 text-white dark:text-slate-950 text-sm font-bold hover:opacity-95 active:scale-[0.99] transition"
          >
            Save Transaction
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
