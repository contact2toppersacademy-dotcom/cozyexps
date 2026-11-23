import React, { useState } from 'react';
import { CurrencyCode, Wallet } from '../types/tracker';
import { formatMoney, fromBasePKR, toBasePKR } from '../utils/trackerData';
import { ModalShell } from './ModalShell';

interface WalletsModalProps {
  open: boolean;
  wallets: Wallet[];
  balances: Record<string, number>;
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  onClose: () => void;
  onAdjustWallet: (walletId: string, newBalancePKR: number) => void;
  onTransfer: (fromId: string, toId: string, amountPKR: number) => void;
}

export const WalletsModal: React.FC<WalletsModalProps> = ({
  open,
  wallets,
  balances,
  currency,
  rates,
  onClose,
  onAdjustWallet,
  onTransfer,
}) => {
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState('');

  const [fromId, setFromId] = useState('bank');
  const [toId, setToId] = useState('cash');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferErr, setTransferErr] = useState('');

  const startAdjust = (w: Wallet) => {
    setEditingWalletId(w.id);
    const curDisp = fromBasePKR(balances[w.id] || 0, currency, rates);
    setAdjustValue(String(Number(curDisp.toFixed(2))));
  };

  const submitAdjust = (walletId: string) => {
    const val = parseFloat(adjustValue);
    if (Number.isNaN(val)) return;
    onAdjustWallet(walletId, toBasePKR(val, currency, rates));
    setEditingWalletId(null);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferErr('');
    if (fromId === toId) {
      setTransferErr('Choose two different wallets.');
      return;
    }
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) return;
    onTransfer(fromId, toId, toBasePKR(amt, currency, rates));
    setTransferAmount('');
  };

  return (
    <ModalShell open={open} title="Wallets & Transfer" onClose={onClose}>
      <div className="space-y-2.5">
        {wallets.map((w) => (
          <div
            key={w.id}
            className="rounded-[16px] bg-slate-50 dark:bg-[#18233d] border border-slate-900/5 dark:border-white/8 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-[12px] flex items-center justify-center text-base shrink-0 ${w.accentBg} ${w.accentText}`}
                >
                  {w.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold truncate">{w.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
                    {formatMoney(balances[w.id] || 0, currency, rates)}
                  </div>
                </div>
              </div>

              {editingWalletId !== w.id && (
                <button
                  type="button"
                  onClick={() => startAdjust(w)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 text-xs font-bold hover:bg-slate-100 dark:hover:bg-[#1f2d4d] transition"
                >
                  Adjust
                </button>
              )}
            </div>

            {editingWalletId === w.id && (
              <div className="flex items-center gap-2 mt-2.5">
                <input
                  type="number"
                  step="0.01"
                  value={adjustValue}
                  onChange={(e) => setAdjustValue(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#131c31] border border-slate-900/10 dark:border-white/10 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <button
                  type="button"
                  onClick={() => submitAdjust(w.id)}
                  className="px-3 py-2 rounded-xl bg-[#0f294a] dark:bg-blue-500 text-white dark:text-slate-950 text-xs font-bold"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingWalletId(null)}
                  className="px-2.5 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <hr className="my-4 border-slate-900/8 dark:border-white/8" />

      <h3 className="text-sm font-extrabold mb-2.5">Transfer Between Wallets</h3>
      <form onSubmit={handleTransfer} className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              From
            </label>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
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
              To
            </label>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-[14px] bg-slate-100 dark:bg-[#18233d] border border-slate-900/6 dark:border-white/8 text-sm font-medium"
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
            Amount ({currency})
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2.5 rounded-[14px] bg-slate-100 dark:bg-[#18233d] border border-slate-900/6 dark:border-white/8 text-sm font-semibold"
          />
        </div>

        {transferErr && <p className="text-xs font-semibold text-rose-500">{transferErr}</p>}

        <button
          type="submit"
          className="w-full h-11 rounded-[15px] bg-[#0f294a] dark:bg-blue-500 text-white dark:text-slate-950 text-sm font-bold hover:opacity-95 transition"
        >
          Transfer Money
        </button>
      </form>
    </ModalShell>
  );
};
