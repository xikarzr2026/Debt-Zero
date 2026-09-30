'use client';

import React from 'react';
import { useDebt } from '@/context/DebtContext';
import {
  TrendingDown,
  Calendar,
  DollarSign,
  Zap,
  Sparkles,
  Sliders,
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
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden group bg-white/95 border-amber-200/90 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Total Debt Owed</span>
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          {formatCurrency(totalBalance)}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
            {debts.length} {debts.length === 1 ? 'account' : 'accounts'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
            {weightedApr}% Blended APR
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 font-medium">
          Base minimums: {formatCurrency(totalMinPayments)}/mo
        </div>
      </div>

      {/* 2. Projected Debt-Free Date */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden group bg-white/95 border-sky-200/90 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-900">Debt-Free Date</span>
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-baseline gap-2">
          <span>{activePlan.debtFreeDate || 'Calculating...'}</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {monthsSaved > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
              <Zap className="w-3 h-3 fill-current text-emerald-600" />
              Saves {yearsSaved > 0 ? `${yearsSaved}y ` : ''}
              {remMonthsSaved > 0 ? `${remMonthsSaved}m` : ''}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
              Baseline pace
            </span>
          )}
          <span className="text-xs text-slate-500 font-medium">
            ({activePlan.totalMonths} mos)
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 font-medium">
          vs Minimums: {comparison.baselineMinimums.debtFreeDate}
        </div>
      </div>

      {/* 3. Total Interest Payable */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden group bg-white/95 border-rose-200/90 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-900">Total Interest</span>
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          {formatCurrency(activePlan.totalInterestPaid)}
        </div>
        <div className="mt-3 flex items-center gap-2">
          {interestSaved > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Saved {formatCurrency(interestSaved)}!
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold text-xs border border-rose-200">
              Full interest cost
            </span>
          )}
        </div>
        <div className="mt-2 text-[11px] text-slate-500 font-medium">
          Lifetime cost: {formatCurrency(activePlan.totalAmountPaid)}
        </div>
      </div>

      {/* 4. Monthly Discretionary Surplus (Interactive Accelerator) */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden group border-2 border-emerald-500/50 bg-emerald-50/50 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-current text-emerald-600" />
            Monthly Accelerator
          </span>
          <button
            onClick={onOpenCashFlow}
            className="text-xs text-emerald-700 hover:text-emerald-900 transition-colors p-1"
            title="Adjust Income & Living Expenses"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
        <div className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-800">
          +{formatCurrency(effectiveSurplus)}/mo
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <button
            onClick={() => handleSurplusChange(-50)}
            disabled={effectiveSurplus <= 0}
            className="w-7 h-7 rounded-lg bg-white border border-amber-200 text-slate-700 hover:bg-amber-100 disabled:opacity-40 font-bold text-sm flex items-center justify-center transition-all shadow-2xs"
            title="Decrease surplus by $50"
          >
            -
          </button>
          <button
            onClick={() => handleSurplusChange(50)}
            className="px-2.5 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center transition-all shadow-xs"
            title="Increase surplus by $50"
          >
            +$50
          </button>
          <button
            onClick={() => handleSurplusChange(200)}
            className="px-2.5 h-7 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center transition-all shadow-xs"
            title="Increase surplus by $200"
          >
            +$200
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <span>Extra discretionary cash</span>
          <button
            onClick={onOpenCashFlow}
            className="text-emerald-800 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
          >
            Budget Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
