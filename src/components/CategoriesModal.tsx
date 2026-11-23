import React, { useState } from 'react';
import { Category, TransactionType } from '../types/tracker';
import { ModalShell } from './ModalShell';

interface CategoriesModalProps {
  open: boolean;
  categories: Category[];
  onClose: () => void;
  onAddCategory: (name: string, type: TransactionType, icon: string) => void;
  onRequestDeleteCategory: (cat: Category) => void;
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({
  open,
  categories,
  onClose,
  onAddCategory,
  onRequestDeleteCategory,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [icon, setIcon] = useState('✨');
  const [name, setName] = useState('');

  const activeCategories = categories.filter((c) => !c.deleted);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddCategory(name.trim(), type, icon.trim() || '✨');
    setName('');
  };

  return (
    <ModalShell open={open} title="Categories" onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className="rounded-[16px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 p-3.5 mb-4 space-y-2.5"
      >
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full px-3 py-2 rounded-[12px] bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 text-sm font-medium"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Emoji Icon
            </label>
            <input
              type="text"
              maxLength={4}
              required
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-3 py-2 rounded-[12px] bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 text-sm font-medium"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name..."
            className="flex-1 px-3 py-2 rounded-[12px] bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 text-sm font-medium"
          />
          <button
            type="submit"
            className="px-4 rounded-[12px] bg-[#0f294a] dark:bg-blue-500 text-white dark:text-slate-950 text-xs font-bold"
          >
            Add
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {activeCategories.map((c) => (
          <div
            key={c.id}
            className="rounded-[15px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 px-3 py-2.5 flex items-center justify-between gap-2"
          >
            <div className="min-w-0 flex items-center gap-2">
              <span className="text-lg">{c.icon}</span>
              <span className="text-sm font-bold truncate">{c.name}</span>
              <span
                className={`text-[11px] font-bold ${
                  c.type === 'income'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                · {c.type}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRequestDeleteCategory(c)}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </ModalShell>
  );
};
