'use client';

import React from 'react';
import { useDebt } from '@/context/DebtContext';
import {
  Sparkles,
  Gift,
  ArrowRight,
  Zap,
  TrendingDown,
  RotateCcw,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const WindfallSimulator: React.FC = () => {
  const {
    windfall,
    setWindfall,
    resetWindfall,
    applyWindfallToSurplus,
    comparison,
    formatCurrency,
    debts,
    strategy,
    effectiveSurplus,
  } = useDebt();

  const windfallImpact = comparison.windfallImpact;

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#38bdf8', '#fbbf24', '#f43f5e'],
    });
  };

  const handleAmountChange = (val: number) => {
    setWindfall({
      ...windfall,
      amount: Math.max(0, val),
    });
  };

  const handleQuickAdd = (added: number) => {
    setWindfall({
      ...windfall,
      amount: (windfall.amount || 0) + added,
    });
  };

  const activePlanInterest = comparison.avalanche.totalInterestPaid;
  const windfallInterest = comparison.windfallAvalanche?.totalInterestPaid ?? activePlanInterest;
  const interestSaved = Math.max(0, activePlanInterest - windfallInterest);

  const activeMonths = comparison.avalanche.totalMonths;
  const windfallMonths = comparison.windfallAvalanche?.totalMonths ?? activeMonths;
  const monthsSaved = Math.max(0, activeMonths - windfallMonths);

  const newDate = comparison.windfallAvalanche?.debtFreeDate || comparison.avalanche.debtFreeDate;
  const targetDebtName = windfallImpact?.recommendedTargetDebtName || 'Top APR Debt';

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 w-full border-cyan-500/20 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/10 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center border border-cyan-500/30">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 text-white">
                Windfall & Lump Sum Allocator
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 text-cyan-400 border border-cyan-500/30">
                Bonus / Tax Refund
              </span>
            </div>
            <p className="text-xs text-slate-500 text-slate-400">
              Got a bonus, tax refund, gift, or side-hustle cash? Simulate its compounding power.
            </p>
          </div>
        </div>

        {windfall.amount > 0 && (
          <button
            onClick={resetWindfall}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors self-start sm:self-auto px-2 py-1 rounded-md hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bonus</span>
          </button>
        )}
      </div>

      {/* Inputs Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5">
        {/* Cash Amount Input & Preset Chips */}
        <div className="md:col-span-7 space-y-3">
          <label className="text-xs font-semibold text-slate-700 text-slate-300 flex items-center justify-between">
            <span>Extra Available Cash</span>
            <span className="text-slate-400 font-normal">Enter dollar amount or tap presets</span>
          </label>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
              $
            </span>
            <input
              type="number"
              min="0"
              step="50"
              value={windfall.amount === 0 ? '' : windfall.amount}
              onChange={(e) => handleAmountChange(Number(e.target.value))}
              placeholder="e.g. 1500"
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-white bg-slate-900/90 border border-slate-300 border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 text-white font-bold text-lg"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-400">Quick add:</span>
            {[250, 500, 1000, 2500, 5000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleQuickAdd(preset)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 bg-slate-800 text-slate-700 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-400 border border-slate-200 border-slate-700/80 transition-all active:scale-95"
              >
                +${preset.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Application Mode & Allocation Target */}
        <div className="md:col-span-5 space-y-3">
          <label className="text-xs font-semibold text-slate-700 text-slate-300">
            Allocation Mode
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setWindfall({ ...windfall, type: 'one_time' })}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                windfall.type === 'one_time'
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 text-cyan-300 ring-1 ring-cyan-500/30'
                  : 'bg-white bg-slate-800/60 border-slate-200 border-slate-700 text-slate-600 text-slate-400'
              }`}
            >
              <div className="font-bold">One-Time Lump Sum</div>
              <div className="text-[10px] font-normal text-slate-400 mt-0.5">Applied immediately</div>
            </button>

            <button
              type="button"
              onClick={() => setWindfall({ ...windfall, type: 'monthly_extra' })}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                windfall.type === 'monthly_extra'
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 text-cyan-300 ring-1 ring-cyan-500/30'
                  : 'bg-white bg-slate-800/60 border-slate-200 border-slate-700 text-slate-600 text-slate-400'
              }`}
            >
              <div className="font-bold">Recurring Extra</div>
              <div className="text-[10px] font-normal text-slate-400 mt-0.5">Added every month</div>
            </button>
          </div>

          {/* Target Account Selector */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Target Creditor / Account
            </label>
            <select
              value={windfall.targetDebtId || 'auto_optimal'}
              onChange={(e) => setWindfall({ ...windfall, targetDebtId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white bg-slate-900 border border-slate-300 border-slate-700 text-xs text-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="auto_optimal">⚡ Auto-Optimal ({strategy} recommendation)</option>
              {debts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.apr}% APR • {formatCurrency(d.balance)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Real-time Impact Banner */}
      {windfall.amount > 0 ? (
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-emerald-500/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm sm:text-base text-slate-900 text-white">
                  Windfall Impact Assessment
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 text-slate-200 leading-relaxed">
                Applying <strong className="text-emerald-400">{formatCurrency(windfall.amount)}</strong>{' '}
                {windfall.type === 'one_time' ? 'as a lump sum' : 'monthly'}{' '}
                to <strong className="text-cyan-400">{targetDebtName}</strong>{' '}
                {monthsSaved > 0 ? (
                  <>
                    shaves <strong className="text-emerald-400">{monthsSaved} months</strong> off your timeline and
                    saves <strong className="text-emerald-400">{formatCurrency(interestSaved)}</strong> in avoided interest!
                  </>
                ) : (
                  <>
                    saves <strong className="text-emerald-400">{formatCurrency(interestSaved)}</strong> in interest!
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={triggerConfetti}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Simulate & Celebrate</span>
              </button>
            </div>
          </div>

          {/* Quick Before & After Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-emerald-500/20 text-center">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">New Debt-Free Date</div>
              <div className="font-extrabold text-sm text-emerald-400">{newDate}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Interest Avoided</div>
              <div className="font-extrabold text-sm text-emerald-400">+{formatCurrency(interestSaved)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Months Accelerated</div>
              <div className="font-extrabold text-sm text-emerald-400">{monthsSaved} mos faster</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-100/60 bg-slate-900/40 border border-slate-200 border-slate-800 text-center">
          <p className="text-xs text-slate-500 text-slate-400">
            Type any bonus amount above or click a quick-add chip (e.g. +$1,000) to see how much interest you can eliminate.
          </p>
        </div>
      )}
    </div>
  );
};
