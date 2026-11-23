import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

interface ModalShellProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const ModalShell: React.FC<ModalShellProps> = ({ open, title, onClose, children }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            key="modal-sheet"
            initial={{ y: 36, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 28, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="w-full sm:max-w-[460px] max-h-[90vh] overflow-y-auto cozy-scroll bg-white dark:bg-[#131c31] text-slate-900 dark:text-slate-100 rounded-t-[24px] sm:rounded-[24px] p-5 pb-7 shadow-2xl border border-slate-900/6 dark:border-white/10"
          >
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3 sm:hidden" />
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-[17px] font-extrabold tracking-tight">{title}</h2>
              <motion.button
                type="button"
                whileHover={{ scale: 1.07, rotate: 90 }}
                whileTap={{ scale: 0.92 }}
                transition={{ duration: 0.18 }}
                onClick={onClose}
                aria-label="Close modal"
                className="w-8 h-8 rounded-[11px] bg-slate-100 dark:bg-[#18233d] text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[#1f2d4d] transition"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
