'use client';

import React, { useState } from 'react';
import { useDebt } from '@/context/DebtContext';
import {
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Calendar,
  Zap,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const MonthlyChecklist: React.FC = () => {
  const {
    activePlan,
    debts,
    checklist,
    toggleChecklistItem,
    resetChecklist,
    formatCurrency,
    strategy,
  } = useDebt();

  const [copied, setCopied] = useState(false);

  if (!activePlan.schedule || activePlan.schedule.length === 0) {
    return null;
  }

  const currentMonthSnapshot = activePlan.schedule[0];
  const allCompleted = checklist.length > 0 && checklist.every((item) => item.completed);
  const completedCount = checklist.filter((item) => item.completed).length;

  const handleToggle = (debtId: string) => {
    toggleChecklistItem(debtId);
    // If this toggle completes the list, fire celebration confetti!
    const updatedCompleted = checklist.filter((c) => (c.debtId === debtId ? !c.completed : c.completed)).length;
    if (updatedCompleted === checklist.length && checklist.length > 0) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#38bdf8'],
      });
    }
  };

  const copyToClipboard = () => {
    const lines = [
      `DebtZero Monthly Payment Plan (${currentMonthSnapshot.dateFormatted}):`,
      `Strategy: ${strategy.toUpperCase()}`,
      `Total to pay this month: ${formatCurrency(currentMonthSnapshot.totalPayment)}`,
      '',
      ...currentMonthSnapshot.payments.map((p) => {
        const debt = debts.find((d) => d.id === p.debtId);
        const due = debt?.dueDate ? `Due: ${debt.dueDate}th` : 'Due: mid-month';
        const extra = p.extraPayment > 0 ? ` (Min: ${formatCurrency(p.minPayment)} + Extra: ${formatCurrency(p.extraPayment)})` : '';
        return `• ${p.debtName}: ${formatCurrency(p.totalPayment)}${extra} [${due}]`;
      }),
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 w-full relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Month 1 Execution Checklist
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {currentMonthSnapshot.dateFormatted}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Exact payment distribution to execute this billing cycle across your accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Copy payment instructions to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Plan'}</span>
          </button>

          {completedCount > 0 && (
            <button
              onClick={resetChecklist}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reset checkmarks"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs font-semibold mb-1.5">
          <span className="text-slate-600 dark:text-slate-300">
            Billing Cycle Progress ({completedCount} of {checklist.length} paid)
          </span>
          <span className="text-emerald-600 dark:text-emerald-400">
            {checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
            style={{
              width: `${checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* All Paid Celebration Card */}
      {allCompleted && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 animate-bounce" />
          <div className="text-xs">
            <span className="font-bold">Outstanding work!</span> You have executed 100% of this month’s debt elimination plan. You are one step closer to complete financial independence.
          </div>
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-2.5">
        {currentMonthSnapshot.payments.map((p) => {
          const debt = debts.find((d) => d.id === p.debtId);
          const isTargeted = p.extraPayment > 0;
          const isDone = !!checklist.find((c) => c.debtId === p.debtId)?.completed;

          return (
            <div
              key={p.debtId}
              onClick={() => handleToggle(p.debtId)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isDone
                  ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30 opacity-75'
                  : isTargeted
                  ? 'glass-panel border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                  : 'glass-panel hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-emerald-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-6 h-6 fill-emerald-500 text-white" /> : <Circle className="w-5 h-5" />}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-sm ${
                        isDone
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {p.debtName}
                    </span>

                    {isTargeted && !isDone && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        Acceleration Target
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due by {debt?.dueDate ? `${debt.dueDate}th` : '15th'}
                    </span>
                    <span>•</span>
                    <span>
                      Required Min: {formatCurrency(p.minPayment)}
                    </span>
                    {p.extraPayment > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-500 font-semibold">
                          Extra Surplus: +{formatCurrency(p.extraPayment)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Payment to Send */}
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Send to Creditor
                </div>
                <div
                  className={`text-base font-extrabold ${
                    isDone
                      ? 'line-through text-slate-400'
                      : isTargeted
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {formatCurrency(p.totalPayment)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Total */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          Total Discretionary Cash Outflow this Month:
        </span>
        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
          {formatCurrency(currentMonthSnapshot.totalPayment)}
        </span>
      </div>
    </div>
  );
};
