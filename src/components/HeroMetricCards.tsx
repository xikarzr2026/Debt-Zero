'use client';

import React from 'react';
import { useDebt } from '@/context/DebtContext';
import {
  TrendingDown,
  Calendar,
  DollarSign,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface HeroMetricCardsProps {
  onOpenCashFlow: () => void;
}

export const HeroMetricCards: React.FC<HeroMetricCardsProps> = ({ onOpenCashFlow }) => {
  const {
    debts,
    activePlan,
    comparison,
    formatCurrency,
    effectiveSurplus,
    profile,
    updateProfile,
    strategy,
  } = useDebt();

  const totalBalance = debts.reduce((sum, d) => sum + (Number(d.balance) || 0), 0);
  const totalMinPayments = debts.reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);

  // Blended average APR weighted by balance
  const weightedApr = totalBalance > 0
    ? (debts.reduce((sum, d) => sum + d.balance * d.apr, 0) / totalBalance).toFixed(1)
    : '0.0';

  // Compare active plan vs baseline minimums
  const baselineMonths = comparison.baselineMinimums.totalMonths;
  const activeMonths = activePlan.totalMonths;
  const monthsSaved = Math.max(0, baselineMonths - activeMonths);
  const yearsSaved = Math.floor(monthsSaved / 12);
  const remMonthsSaved = monthsSaved % 12;

  const baselineInterest = comparison.baselineMinimums.totalInterestPaid;
  const activeInterest = activePlan.totalInterestPaid;
  const interestSaved = Math.max(0, baselineInterest - activeInterest);

  const handleSurplusChange = (delta: number) => {
    const current = profile.manualExtraMonthlySurplus ?? effectiveSurplus;
    const next = Math.max(0, current + delta);
    updateProfile({ manualExtraMonthlySurplus: next });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Debt Remaining */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Debt Owed</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {formatCurrency(totalBalance)}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            {debts.length} {debts.length === 1 ? 'account' : 'accounts'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/20">
            {weightedApr}% Blended APR
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          Base minimums: {formatCurrency(totalMinPayments)}/mo
        </div>
      </div>

      {/* 2. Projected Debt-Free Date */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Debt-Free Date</span>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-baseline gap-2">
          <span>{activePlan.debtFreeDate || 'Calculating...'}</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {monthsSaved > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-xs border border-emerald-500/20">
              <Zap className="w-3 h-3 fill-current" />
              Saves {yearsSaved > 0 ? `${yearsSaved}y ` : ''}
              {remMonthsSaved > 0 ? `${remMonthsSaved}m` : ''}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs">
              Baseline pace
            </span>
          )}
          <span className="text-xs text-slate-400 dark:text-slate-500">
            ({activePlan.totalMonths} mos)
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          vs Minimums: {comparison.baselineMinimums.debtFreeDate}
        </div>
      </div>

      {/* 3. Total Interest Payable */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Interest</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {formatCurrency(activePlan.totalInterestPaid)}
        </div>
        <div className="mt-3 flex items-center gap-2">
          {interestSaved > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs border border-emerald-500/20">
              <Sparkles className="w-3 h-3" />
              Saved {formatCurrency(interestSaved)}!
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 font-medium text-xs">
              Full interest cost
            </span>
          )}
        </div>
        <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          Lifetime cost: {formatCurrency(activePlan.totalAmountPaid)}
        </div>
      </div>

      {/* 4. Monthly Discretionary Surplus (Interactive Accelerator) */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden group border-emerald-500/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/30 transition-all pointer-events-none" />
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-current" />
            Monthly Accelerator
          </span>
          <button
            onClick={onOpenCashFlow}
            className="text-xs text-slate-400 hover:text-emerald-500 transition-colors p-1"
            title="Adjust Income & Living Expenses"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
          +{formatCurrency(effectiveSurplus)}/mo
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <button
            onClick={() => handleSurplusChange(-50)}
            disabled={effectiveSurplus <= 0}
            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 font-bold text-sm flex items-center justify-center transition-all"
            title="Decrease surplus by $50"
          >
            -
          </button>
          <button
            onClick={() => handleSurplusChange(50)}
            className="px-2 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center transition-all"
            title="Increase surplus by $50"
          >
            +$50
          </button>
          <button
            onClick={() => handleSurplusChange(200)}
            className="px-2 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center transition-all"
            title="Increase surplus by $200"
          >
            +$200
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>Extra discretionary cash</span>
          <button
            onClick={onOpenCashFlow}
            className="text-emerald-500 hover:underline cursor-pointer"
          >
            Budget Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
