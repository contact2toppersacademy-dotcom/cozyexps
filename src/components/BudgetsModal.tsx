import React, { useEffect, useState } from 'react';
import {
  BudgetConfig,
  Category,
  CurrencyCode,
  Transaction,
} from '../types/tracker';
import { formatMoney, fromBasePKR, toBasePKR, todayStr } from '../utils/trackerData';
import { ModalShell } from './ModalShell';

interface BudgetsModalProps {
  open: boolean;
  budgets: BudgetConfig;
  categories: Category[];
  transactions: Transaction[];
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  onClose: () => void;
  onSaveOverallBudget: (limitPKR: number) => void;
  onSaveCategoryBudget: (categoryId: string, limitPKR: number) => void;
}

export const BudgetsModal: React.FC<BudgetsModalProps> = ({
  open,
  budgets,
  categories,
  transactions,
  currency,
  rates,
  onClose,
  onSaveOverallBudget,
  onSaveCategoryBudget,
}) => {
  const [overallInput, setOverallInput] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catInput, setCatInput] = useState('');

  useEffect(() => {
    if (!open) return;
    const cur = Number(budgets.overallMonthly || 0);
    setOverallInput(cur > 0 ? String(Math.round(fromBasePKR(cur, currency, rates))) : '');
    setEditingCatId(null);
  }, [open, budgets.overallMonthly, currency, rates]);

  const curMonth = todayStr().slice(0, 7);
  const monthExpenses = transactions.filter(
    (t) => !t.deleted && t.type === 'expense' && t.date.startsWith(curMonth)
  );
  const totalSpent = monthExpenses.reduce((s, t) => s + Number(t.amount), 0);
  const overallLimit = Number(budgets.overallMonthly || 0);
  const overallPct = overallLimit > 0 ? Math.min(100, (totalSpent / overallLimit) * 100) : 0;

  const expenseCategories = categories.filter((c) => !c.deleted && c.type === 'expense');

  const handleSaveOverall = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(overallInput) || 0;
    onSaveOverallBudget(Math.max(0, toBasePKR(val, currency, rates)));
  };

  const startCatEdit = (catId: string) => {
    setEditingCatId(catId);
    const cur = budgets.byCategory?.[catId]?.limit || 0;
    setCatInput(cur > 0 ? String(Math.round(fromBasePKR(cur, currency, rates))) : '');
  };

  const saveCatEdit = (catId: string) => {
    const val = Math.max(0, parseFloat(catInput) || 0);
    onSaveCategoryBudget(catId, toBasePKR(val, currency, rates));
    setEditingCatId(null);
  };

  return (
    <ModalShell open={open} title="Monthly Budgets & Alerts" onClose={onClose}>
      <form
        onSubmit={handleSaveOverall}
        className="rounded-[16px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 p-3.5 mb-4"
      >
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
          Overall Monthly Spending Limit ({currency})
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="1"
            value={overallInput}
            onChange={(e) => setOverallInput(e.target.value)}
            placeholder="0 = disabled"
            className="flex-1 px-3 py-2 rounded-[12px] bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 text-sm font-semibold"
          />
          <button
            type="submit"
            className="px-4 rounded-[12px] bg-[#0f294a] dark:bg-blue-500 text-white dark:text-slate-950 text-xs font-bold"
          >
            Save
          </button>
        </div>

        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2.5 font-mono-num">
          <span>Spent: {formatMoney(totalSpent, currency, rates)}</span>
          {overallLimit > 0 && <span>Limit: {formatMoney(overallLimit, currency, rates)}</span>}
        </div>
        {overallLimit > 0 && (
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all ${
                totalSpent >= overallLimit
                  ? 'bg-rose-500'
                  : overallPct >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
        )}
      </form>

      <h3 className="text-sm font-extrabold mb-2.5">Category Budgets (This Month)</h3>
      <div className="space-y-2.5">
        {expenseCategories.map((c) => {
          const limitPKR = budgets.byCategory?.[c.id]?.limit || 0;
          const spent = monthExpenses
            .filter((t) => t.categoryId === c.id)
            .reduce((s, t) => s + Number(t.amount), 0);
          const pct = limitPKR > 0 ? Math.min(100, (spent / limitPKR) * 100) : 0;

          return (
            <div
              key={c.id}
              className="rounded-[16px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">
                  {c.icon} {c.name}
                </span>
                {editingCatId !== c.id && (
                  <button
                    type="button"
                    onClick={() => startCatEdit(c.id)}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 text-xs font-bold font-mono-num"
                  >
                    {limitPKR > 0 ? formatMoney(limitPKR, currency, rates) : 'Set Limit'}
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono-num">
                Spent: {formatMoney(spent, currency, rates)}
                {limitPKR > 0 ? ` (${Math.round((spent / limitPKR) * 100)}%)` : ''}
              </div>

              {editingCatId === c.id && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={catInput}
                    onChange={(e) => setCatInput(e.target.value)}
                    placeholder="0 to remove"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#131c31] border border-slate-900/10 dark:border-white/10 text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => saveCatEdit(c.id)}
                    className="px-3 py-1.5 rounded-xl bg-[#0f294a] dark:bg-blue-500 text-white dark:text-slate-950 text-xs font-bold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCatId(null)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {limitPKR > 0 && (
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      spent >= limitPKR
                        ? 'bg-rose-500'
                        : pct >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
};
