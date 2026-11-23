import React, { useState } from 'react';
import { CurrencyCode, Loan, LoanType, Wallet } from '../types/tracker';
import { formatDateShort, formatMoney, fromBasePKR, toBasePKR } from '../utils/trackerData';
import { ModalShell } from './ModalShell';

interface LoansModalProps {
  open: boolean;
  loans: Loan[];
  wallets: Wallet[];
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  onClose: () => void;
  onAddLoan: (loan: {
    type: LoanType;
    person: string;
    amountPKR: number;
    walletId: string;
    dueDate?: string;
    affectWallet: boolean;
  }) => void;
  onRepayLoan: (loanId: string, amountPKR: number) => void;
  onRequestDeleteLoan: (loan: Loan) => void;
}

export const LoansModal: React.FC<LoansModalProps> = ({
  open,
  loans,
  wallets,
  currency,
  rates,
  onClose,
  onAddLoan,
  onRepayLoan,
  onRequestDeleteLoan,
}) => {
  const [type, setType] = useState<LoanType>('lent');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || 'cash');
  const [dueDate, setDueDate] = useState('');
  const [affectWallet, setAffectWallet] = useState(true);

  const [repayingLoanId, setRepayingLoanId] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState('');

  const activeLoans = loans
    .filter((l) => !l.deleted)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  let totalLent = 0;
  let totalBorrowed = 0;
  for (const l of activeLoans) {
    const paid = (l.repayments || []).reduce((s, r) => s + Number(r.amount), 0);
    const rem = Math.max(0, Number(l.amount) - paid);
    if (l.type === 'lent') totalLent += rem;
    else totalBorrowed += rem;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0 || !person.trim()) return;
    onAddLoan({
      type,
      person: person.trim(),
      amountPKR: Math.round(toBasePKR(num, currency, rates) * 100) / 100,
      walletId,
      dueDate: dueDate || undefined,
      affectWallet,
    });
    setPerson('');
    setAmount('');
    setDueDate('');
  };

  const startRepay = (loan: Loan, remainingPKR: number) => {
    setRepayingLoanId(loan.id);
    const disp = fromBasePKR(remainingPKR, currency, rates);
    setRepayAmount(String(Number(disp.toFixed(2))));
  };

  const submitRepay = (loanId: string, remainingPKR: number) => {
    const num = parseFloat(repayAmount);
    if (!num || num <= 0) return;
    const payPKR = Math.min(remainingPKR, Math.round(toBasePKR(num, currency, rates) * 100) / 100);
    onRepayLoan(loanId, payPKR);
    setRepayingLoanId(null);
  };

  return (
    <ModalShell open={open} title="Loan Tracker" onClose={onClose}>
      <div className="rounded-[16px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 p-3.5 mb-4 grid grid-cols-2 divide-x divide-slate-900/8 dark:divide-white/8 text-center">
        <div className="pr-2">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            To Receive (Lent)
          </div>
          <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono-num mt-0.5">
            {formatMoney(totalLent, currency, rates)}
          </div>
        </div>
        <div className="pl-2">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            To Pay (Borrowed)
          </div>
          <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400 font-mono-num mt-0.5">
            {formatMoney(totalBorrowed, currency, rates)}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5 mb-5">
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-[14px] bg-slate-100 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/6">
          <button
            type="button"
            onClick={() => setType('lent')}
            className={`py-2 rounded-[11px] text-xs font-bold transition ${
              type === 'lent'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            I Lent (Given)
          </button>
          <button
            type="button"
            onClick={() => setType('borrowed')}
            className={`py-2 rounded-[11px] text-xs font-bold transition ${
              type === 'borrowed'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            I Borrowed
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Person Name
            </label>
            <input
              type="text"
              required
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="e.g., Ali"
              className="w-full px-3 py-2.5 rounded-[14px] bg-slate-100 dark:bg-[#18233d] border border-slate-900/6 dark:border-white/8 text-sm font-medium"
            />
          </div>
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
              className="w-full px-3 py-2.5 rounded-[14px] bg-slate-100 dark:bg-[#18233d] border border-slate-900/6 dark:border-white/8 text-sm font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Wallet
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-[14px] bg-slate-100 dark:bg-[#18233d] border border-slate-900/6 dark:border-white/8 text-sm font-medium"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.icon} {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Due Date (optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-[14px] bg-slate-100 dark:bg-[#18233d] border border-slate-900/6 dark:border-white/8 text-sm font-medium"
            />
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[14px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 cursor-pointer">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Update wallet balance
          </span>
          <input
            type="checkbox"
            checked={affectWallet}
            onChange={(e) => setAffectWallet(e.target.checked)}
            className="w-4 h-4 accent-emerald-600 rounded"
          />
        </label>

        <button
          type="submit"
          className="w-full h-11 rounded-[15px] bg-[#0f294a] dark:bg-blue-500 text-white dark:text-slate-950 text-sm font-bold hover:opacity-95 transition"
        >
          Add Loan Record
        </button>
      </form>

      <div className="space-y-2.5">
        {activeLoans.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
            No loan records yet.
          </div>
        ) : (
          activeLoans.map((l) => {
            const paid = (l.repayments || []).reduce((s, r) => s + Number(r.amount), 0);
            const rem = Math.max(0, Number(l.amount) - paid);
            const settled = rem <= 0.01;
            const isLent = l.type === 'lent';

            return (
              <div
                key={l.id}
                className="rounded-[16px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {l.person}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span
                        className={`font-bold ${
                          isLent
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isLent ? 'Lent' : 'Borrowed'}
                      </span>
                      <span className="mx-1.5">·</span>
                      <span className="font-mono-num">
                        Total {formatMoney(l.amount, currency, rates)}
                      </span>
                      {l.dueDate && (
                        <>
                          <span className="mx-1.5">·</span>
                          <span>Due {formatDateShort(l.dueDate)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-bold font-mono-num shrink-0 ${
                      settled
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {settled ? 'Settled' : `Left ${formatMoney(rem, currency, rates)}`}
                  </span>
                </div>

                {repayingLoanId === l.id ? (
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#131c31] border border-slate-900/10 dark:border-white/10 text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => submitRepay(l.id, rem)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepayingLoanId(null)}
                      className="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3">
                    {!settled && (
                      <button
                        type="button"
                        onClick={() => startRepay(l, rem)}
                        className="flex-1 py-2 rounded-xl bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 text-xs font-bold hover:bg-slate-100 dark:hover:bg-[#1f2d4d] transition"
                      >
                        Record Payment
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRequestDeleteLoan(l)}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/12 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </ModalShell>
  );
};
