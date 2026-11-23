import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { ConfirmState } from '../types/tracker';

interface ConfirmDialogProps {
  state: ConfirmState | null;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ state, onCancel }) => {
  return (
    <AnimatePresence>
      {state && (
        <motion.div
          key="confirm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCancel();
          }}
        >
          <motion.div
            key="confirm-box"
            initial={{ scale: 0.93, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="w-full max-w-[380px] rounded-[22px] bg-white dark:bg-[#131c31] border border-slate-900/8 dark:border-white/10 p-5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0 ${
                  state.danger
                    ? 'bg-rose-500/12 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400'
                    : 'bg-amber-500/12 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[15.5px] font-extrabold text-slate-900 dark:text-white">
                  {state.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {state.message}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-5">
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={onCancel}
                className="h-10 rounded-[14px] bg-slate-100 dark:bg-[#18233d] text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#1f2d4d] transition"
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  state.onConfirm();
                  onCancel();
                }}
                className={`h-10 rounded-[14px] text-white text-xs font-bold transition ${
                  state.danger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#0f294a] hover:bg-[#163a66] dark:bg-blue-500 dark:text-slate-950'
                }`}
              >
                {state.confirmLabel || 'Confirm'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
