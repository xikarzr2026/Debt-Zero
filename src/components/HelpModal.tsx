'use client';

import React from 'react';
import { X, Zap, Flame, ShieldAlert, Sparkles, BookOpen, CheckCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                How DebtZero Optimizes Payoffs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The mathematics and behavioral science behind rapid debt elimination.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mt-5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {/* Strategy 1: Avalanche */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-600 dark:text-emerald-400">
              <Zap className="w-4 h-4 fill-current" />
              <span>Debt Avalanche: The Mathematical Optimum</span>
            </div>
            <p>
              Under Debt Avalanche, you pay minimums on every account, and pour 100% of your extra discretionary surplus into the debt carrying the <strong>highest Annual Percentage Rate (APR)</strong>.
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              <strong>Why it works:</strong> High-APR debt compounds the most aggressively against you every month. Stopping the fastest-spinning interest meter saves the most dollars over the life of your debt.
            </p>
          </div>

          {/* Strategy 2: Snowball */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-cyan-600 dark:text-cyan-400">
              <Flame className="w-4 h-4" />
              <span>Debt Snowball: Psychological Momentum</span>
            </div>
            <p>
              Under Debt Snowball, you pay minimums everywhere, and throw all extra cash at the account with the <strong>smallest current balance</strong>, regardless of interest rate.
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              <strong>Why it works:</strong> Human behavior drives personal finance. Wiping out an entire account in 2 or 3 months gives you an immediate motivational boost and simplifies your monthly bills quickly.
            </p>
          </div>

          {/* Rollover Snowball Effect */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>The Exponential "Rollover" Multiplier</span>
            </div>
            <p>
              When an account reaches a $0 balance, its minimum payment is not spent! Instead, that freed-up minimum is added to your discretionary surplus and rolled over into the next target debt. This creates an exponential payoff curve that accelerates rapidly toward the end.
            </p>
          </div>

          {/* Negative Amortization Alert */}
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              <span>The Minimum Payment Trap & Negative Amortization</span>
            </div>
            <p>
              Creditors calculate minimum payments to maximize their profit. If your minimum payment is less than or barely equal to the monthly interest accrued (<code>Balance * (APR / 12)</code>), you enter <strong>negative amortization</strong> — you will stay in debt indefinitely and pay multiples of your original loan in pure interest.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Got it, let's eliminate debt!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
