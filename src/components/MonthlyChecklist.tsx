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
    const updatedCompleted = checklist.filter((c) => (c.debtId === debtId ? !c.completed : c.completed)).length;
    if (updatedCompleted === checklist.length && checklist.length > 0) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#15803d', '#d97706', '#0284c7'],
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
    <div className="glass-panel rounded-2xl p-5 sm:p-6 w-full bg-white/95 border-amber-200/90 shadow-xs relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Month 1 Execution Checklist
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              {currentMonthSnapshot.dateFormatted}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Exact payment distribution to execute this billing cycle across your accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-xs font-semibold text-slate-700 hover:bg-amber-50 transition-colors shadow-2xs"
            title="Copy payment instructions to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
            <span>{copied ? 'Copied!' : 'Copy Plan'}</span>
          </button>

          {completedCount > 0 && (
            <button
              onClick={resetChecklist}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-amber-100/60 transition-colors"
              title="Reset checkmarks"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs font-bold mb-1.5">
          <span className="text-slate-700">
            Billing Cycle Progress ({completedCount} of {checklist.length} paid)
          </span>
          <span className="text-emerald-800">
            {checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0}%
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-amber-100 overflow-hidden border border-amber-200/60">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-amber-500 transition-all duration-300 rounded-full"
            style={{
              width: `${checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* All Paid Celebration Card */}
      {allCompleted && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-900 flex items-center gap-3 shadow-xs">
          <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 animate-bounce" />
          <div className="text-xs">
            <span className="font-extrabold">Outstanding work!</span> You have executed 100% of this month’s debt elimination plan. You are one step closer to complete financial freedom.
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
                  ? 'bg-emerald-50/60 border-emerald-300 opacity-80'
                  : isTargeted
                  ? 'bg-gradient-to-r from-white to-emerald-50/40 border-2 border-emerald-600 shadow-xs ring-1 ring-emerald-500/20'
                  : 'bg-white hover:bg-amber-50/40 border-amber-200/90 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isDone
                      ? 'text-emerald-700'
                      : 'text-amber-300 hover:text-emerald-600'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-6 h-6 fill-emerald-600 text-white" /> : <Circle className="w-5 h-5" />}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-sm ${
                        isDone
                          ? 'line-through text-slate-400'
                          : 'text-slate-900'
                      }`}
                    >
                      {p.debtName}
                    </span>

                    {isTargeted && !isDone && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        <Zap className="w-2.5 h-2.5 fill-current text-amber-600" />
                        Acceleration Target
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Due by {debt?.dueDate ? `${debt.dueDate}th` : '15th'}
                    </span>
                    <span>•</span>
                    <span>
                      Required Min: {formatCurrency(p.minPayment)}
                    </span>
                    {p.extraPayment > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-800 font-bold">
                          Extra Surplus: +{formatCurrency(p.extraPayment)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Payment to Send */}
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">
                  Send to Creditor
                </div>
                <div
                  className={`text-base font-black ${
                    isDone
                      ? 'line-through text-slate-400'
                      : isTargeted
                      ? 'text-emerald-800'
                      : 'text-slate-900'
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
      <div className="mt-4 pt-3 border-t border-amber-200/80 flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium">
          Total Discretionary Cash Outflow this Month:
        </span>
        <span className="font-black text-sm text-slate-900">
          {formatCurrency(currentMonthSnapshot.totalPayment)}
        </span>
      </div>
    </div>
  );
};
